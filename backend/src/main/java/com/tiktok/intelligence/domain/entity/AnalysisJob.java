package com.tiktok.intelligence.domain.entity;

import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.domain.enums.JobType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "analysis_jobs", indexes = {
    @Index(name = "idx_jobs_user", columnList = "user_id"),
    @Index(name = "idx_jobs_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 50)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filter_params", nullable = false)
    @Builder.Default
    private Map<String, Object> filterParams = new HashMap<>();

    @Column(name = "s3_raw_data_url", columnDefinition = "TEXT")
    private String s3RawDataUrl;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public void markProcessing() {
        this.status = JobStatus.PROCESSING;
        this.startedAt = Instant.now();
    }

    public void markCompleted(String s3Url) {
        this.status = JobStatus.COMPLETED;
        this.s3RawDataUrl = s3Url;
        this.completedAt = Instant.now();
    }

    public void markFailed(String error) {
        this.status = JobStatus.FAILED;
        this.errorMessage = error;
        this.completedAt = Instant.now();
    }
}
