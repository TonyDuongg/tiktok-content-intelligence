package com.tiktok.intelligence.domain.enums;

public enum JobStatus {
    PENDING,
    QUEUED_SQS,
    PROCESSING,
    COMPLETED,
    FAILED
}
