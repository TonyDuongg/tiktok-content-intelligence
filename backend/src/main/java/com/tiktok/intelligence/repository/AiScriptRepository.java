package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.AiScript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiScriptRepository extends JpaRepository<AiScript, Long> {
    List<AiScript> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AiScript> findByJobId(UUID jobId);
    List<AiScript> findByCategoryIdOrderByCreatedAtDesc(Long categoryId);
}
