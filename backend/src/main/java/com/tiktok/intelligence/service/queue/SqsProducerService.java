package com.tiktok.intelligence.service.queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.config.AwsProperties;
import com.tiktok.intelligence.dto.queue.JobMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SqsProducerService {

    private final SqsClient sqsClient;
    private final AwsProperties awsProperties;
    private final ObjectMapper objectMapper;

    private final Map<String, String> queueUrlCache = new ConcurrentHashMap<>();

    public String resolveQueueUrl(String queueName) {
        return queueUrlCache.computeIfAbsent(queueName, name -> {
            try {
                GetQueueUrlResponse response = sqsClient.getQueueUrl(GetQueueUrlRequest.builder().queueName(name).build());
                return response.queueUrl();
            } catch (QueueDoesNotExistException e) {
                log.info("Queue '{}' does not exist. Creating new queue...", name);
                CreateQueueResponse createResponse = sqsClient.createQueue(CreateQueueRequest.builder().queueName(name).build());
                log.info("Queue '{}' created at URL: {}", name, createResponse.queueUrl());
                return createResponse.queueUrl();
            } catch (Exception e) {
                log.warn("Could not retrieve queue URL for '{}': {}. Using fallback construct.", name, e.getMessage());
                return awsProperties.getEndpoint() + "/000000000000/" + name;
            }
        });
    }

    public void sendJobMessage(JobMessageDto message) {
        String queueName = awsProperties.getSqs().getQueueName();
        String queueUrl = resolveQueueUrl(queueName);
        try {
            String jsonPayload = objectMapper.writeValueAsString(message);
            SendMessageRequest sendRequest = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(jsonPayload)
                    .build();

            SendMessageResponse response = sqsClient.sendMessage(sendRequest);
            log.info("Dispatched Job [{}] to SQS queue '{}', messageId: {}", message.jobId(), queueName, response.messageId());
        } catch (Exception e) {
            log.error("Failed to dispatch Job [{}] to SQS queue '{}': {}", message.jobId(), queueName, e.getMessage());
            throw new RuntimeException("Lỗi gửi tác vụ vào hàng đợi SQS: " + e.getMessage(), e);
        }
    }

    public void sendToDlq(JobMessageDto message, String failureReason) {
        String dlqName = awsProperties.getSqs().getDlqName();
        String dlqUrl = resolveQueueUrl(dlqName);
        try {
            String jsonPayload = objectMapper.writeValueAsString(Map.of(
                    "job", message,
                    "failureReason", failureReason,
                    "failedAt", java.time.Instant.now().toString()
            ));

            SendMessageRequest sendRequest = SendMessageRequest.builder()
                    .queueUrl(dlqUrl)
                    .messageBody(jsonPayload)
                    .build();

            sqsClient.sendMessage(sendRequest);
            log.warn("Job [{}] reached maximum retries and was moved to DLQ '{}'", message.jobId(), dlqName);
        } catch (Exception e) {
            log.error("Failed to forward Job [{}] to DLQ '{}': {}", message.jobId(), dlqName, e.getMessage());
        }
    }
}
