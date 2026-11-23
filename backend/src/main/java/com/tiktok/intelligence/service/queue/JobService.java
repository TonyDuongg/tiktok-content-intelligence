package com.tiktok.intelligence.service.queue;

import com.tiktok.intelligence.domain.entity.AnalysisJob;
import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.dto.queue.JobMessageDto;
import com.tiktok.intelligence.dto.request.JobFilterRequest;
import com.tiktok.intelligence.dto.response.JobResponseDto;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.AnalysisJobRepository;
import com.tiktok.intelligence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final AnalysisJobRepository jobRepository;
    private final UserRepository userRepository;
    private final SqsProducerService sqsProducerService;

    private static final int JOB_CREDIT_COST = 5;

    @Transactional
    public JobResponseDto createAndDispatchJob(String userEmail, JobFilterRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        if (user.getCreditsBalance() < JOB_CREDIT_COST) {
            throw new IllegalArgumentException(String.format(
                    "Số dư credit không đủ (%d/%d). Vui lòng nạp thêm credit để tiếp tục.",
                    user.getCreditsBalance(), JOB_CREDIT_COST
            ));
        }

        // Deduct credits
        user.setCreditsBalance(user.getCreditsBalance() - JOB_CREDIT_COST);
        userRepository.save(user);

        Map<String, Object> filterMap = request.toFilterMap();

        // Create AnalysisJob record
        AnalysisJob job = AnalysisJob.builder()
                .user(user)
                .jobType(request.jobType())
                .status(JobStatus.PENDING)
                .filterParams(filterMap)
                .build();

        job = jobRepository.save(job);

        // Dispatch to SQS Queue
        JobMessageDto message = JobMessageDto.of(job.getId(), user.getId(), job.getJobType(), filterMap);
        sqsProducerService.sendJobMessage(message);

        job.setStatus(JobStatus.QUEUED_SQS);
        job = jobRepository.save(job);

        log.info("Created and enqueued Job [{}] for user [{}]", job.getId(), user.getEmail());
        return JobResponseDto.fromEntity(job);
    }

    @Transactional(readOnly = true)
    public JobResponseDto getJobById(UUID jobId, String userEmail) {
        AnalysisJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ với ID: " + jobId));

        return JobResponseDto.fromEntity(job);
    }

    @Transactional(readOnly = true)
    public List<JobResponseDto> getUserJobs(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        return jobRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(JobResponseDto::fromEntity)
                .toList();
    }
}
