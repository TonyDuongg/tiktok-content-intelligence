package com.tiktok.intelligence.dto.response;

import com.tiktok.intelligence.domain.entity.AnalysisJob;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.domain.enums.JobType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record JobResponseDto(
        UUID jobId,
        JobStatus status,
        JobType jobType,
        Map<String, Object> filterParams,
        String s3RawDataUrl,
        String errorMessage,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt
) {
    public static JobResponseDto fromEntity(AnalysisJob job) {
        return new JobResponseDto(
                job.getId(),
                job.getStatus(),
                job.getJobType(),
                job.getFilterParams(),
                job.getS3RawDataUrl(),
                job.getErrorMessage(),
                job.getStartedAt(),
                job.getCompletedAt(),
                job.getCreatedAt()
        );
    }
}
