package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.AnalysisJob;
import com.tiktok.intelligence.domain.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, UUID> {
    List<AnalysisJob> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AnalysisJob> findByStatus(JobStatus status);
}
