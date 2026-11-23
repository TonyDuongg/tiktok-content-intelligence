package com.tiktok.intelligence.dto.queue;

import com.tiktok.intelligence.domain.enums.JobType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record JobMessageDto(
        UUID jobId,
        UUID userId,
        JobType jobType,
        Map<String, Object> filterParams,
        int retryCount,
        Instant queuedAt
) {
    public static JobMessageDto of(UUID jobId, UUID userId, JobType jobType, Map<String, Object> filterParams) {
        return new JobMessageDto(jobId, userId, jobType, filterParams, 0, Instant.now());
    }

    public JobMessageDto incrementRetry() {
        return new JobMessageDto(jobId, userId, jobType, filterParams, retryCount + 1, queuedAt);
    }
}
