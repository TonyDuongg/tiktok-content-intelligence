package com.tiktok.intelligence.service.queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.config.AwsProperties;
import com.tiktok.intelligence.domain.entity.AiScript;
import com.tiktok.intelligence.domain.entity.AnalysisJob;
import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.dto.queue.JobMessageDto;
import com.tiktok.intelligence.repository.AnalysisJobRepository;
import com.tiktok.intelligence.repository.UserRepository;
import com.tiktok.intelligence.service.ai.AiScriptService;
import com.tiktok.intelligence.service.scraper.DataIngestionService;
import com.tiktok.intelligence.service.storage.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@EnableScheduling
@RequiredArgsConstructor
@ConditionalOnProperty(name = "application.aws.sqs.worker-enabled", havingValue = "true", matchIfMissing = true)
public class SqsJobConsumerWorker {

    private final SqsClient sqsClient;
    private final AwsProperties awsProperties;
    private final ObjectMapper objectMapper;
    private final SqsProducerService producerService;
    private final AnalysisJobRepository jobRepository;
    private final UserRepository userRepository;
    private final DataIngestionService dataIngestionService;
    private final S3StorageService s3StorageService;
    private final AiScriptService aiScriptService;

    private static final int MAX_RETRIES = 3;

    @Scheduled(fixedDelay = 3000)
    public void pollAndProcessJobs() {
        String queueName = awsProperties.getSqs().getQueueName();
        String queueUrl = producerService.resolveQueueUrl(queueName);

        try {
            ReceiveMessageRequest receiveRequest = ReceiveMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .maxNumberOfMessages(5)
                    .waitTimeSeconds(2)
                    .build();

            ReceiveMessageResponse response = sqsClient.receiveMessage(receiveRequest);
            for (Message message : response.messages()) {
                processSingleMessage(message, queueUrl);
            }
        } catch (Exception e) {
            log.debug("Worker poll cycle skipped: {}", e.getMessage());
        }
    }

    public void processSingleMessage(Message message, String queueUrl) {
        JobMessageDto jobMessage = null;
        try {
            jobMessage = objectMapper.readValue(message.body(), JobMessageDto.class);
            log.info("Worker picked up Job [{}] from SQS queue", jobMessage.jobId());

            executeJobBusinessLogic(jobMessage);

            // Acknowledge and delete message on success
            sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());
            log.info("Job [{}] completed successfully. SQS message deleted.", jobMessage.jobId());

        } catch (Exception e) {
            log.error("Error executing Job from SQS message: {}", e.getMessage(), e);
            handleJobFailure(jobMessage, message, queueUrl, e.getMessage());
        }
    }

    @Transactional
    public void executeJobBusinessLogic(JobMessageDto jobMessage) {
        Optional<AnalysisJob> optionalJob = jobRepository.findById(jobMessage.jobId());
        if (optionalJob.isEmpty()) {
            log.warn("Job [{}] not found in database. Skipping.", jobMessage.jobId());
            return;
        }

        AnalysisJob job = optionalJob.get();
        job.markProcessing();
        jobRepository.save(job);

        // 1. Extract target channels from filter parameters
        Map<String, Object> filters = jobMessage.filterParams();
        @SuppressWarnings("unchecked")
        List<String> targetChannels = (List<String>) filters.getOrDefault("targetChannels", List.of("beautytips_vn"));
        if (targetChannels == null || targetChannels.isEmpty()) {
            targetChannels = List.of("beautytips_vn");
        }

        Long categoryId = filters.get("categoryId") != null ? Long.valueOf(filters.get("categoryId").toString()) : null;

        // 2. Ingest channels
        int ingestedCount = 0;
        for (String channel : targetChannels) {
            dataIngestionService.ingestChannelData(channel, categoryId, 10);
            ingestedCount++;
        }

        // 3. Generate AI Viral Script based on top videos
        AiScript script = aiScriptService.generateAndSaveScriptForJob(job);

        // 4. Archive analysis summary to AWS S3
        String s3Key = String.format("jobs/%s/analysis_summary.json", job.getId());
        String s3Url = s3StorageService.uploadJsonPayload(s3Key, Map.of(
                "jobId", job.getId(),
                "scriptId", script.getId(),
                "channelsAnalyzed", targetChannels,
                "ingestedChannelsCount", ingestedCount,
                "filterParams", filters,
                "completedAt", java.time.Instant.now().toString()
        ));

        // 5. Mark job completed
        job.markCompleted(s3Url);
        jobRepository.save(job);
    }

    @Transactional
    public void handleJobFailure(JobMessageDto jobMessage, Message message, String queueUrl, String errorMessage) {
        if (jobMessage == null) {
            // Unparseable message, delete to prevent poison pill
            sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());
            return;
        }

        if (jobMessage.retryCount() < MAX_RETRIES) {
            log.warn("Retrying Job [{}] (attempt {}/{})", jobMessage.jobId(), jobMessage.retryCount() + 1, MAX_RETRIES);
            producerService.sendJobMessage(jobMessage.incrementRetry());
        } else {
            log.error("Job [{}] failed after {} attempts. Moving to DLQ and refunding credits.", jobMessage.jobId(), MAX_RETRIES);
            producerService.sendToDlq(jobMessage, errorMessage);

            // Update job record to FAILED
            jobRepository.findById(jobMessage.jobId()).ifPresent(job -> {
                job.markFailed(errorMessage);
                jobRepository.save(job);
            });

            // Refund user credit balance
            userRepository.findById(jobMessage.userId()).ifPresent(user -> {
                user.setCreditsBalance(user.getCreditsBalance() + 5);
                userRepository.save(user);
                log.info("Refunded 5 credits to User [{}] for failed Job [{}]", user.getId(), jobMessage.jobId());
            });
        }

        // Remove the failed iteration message from SQS
        try {
            sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());
        } catch (Exception ex) {
            log.warn("Could not delete failed message: {}", ex.getMessage());
        }
    }
}
