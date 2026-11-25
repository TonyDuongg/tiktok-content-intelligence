package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.ResearchProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResearchProfileRepository extends JpaRepository<ResearchProfile, Long> {
    List<ResearchProfile> findAllByOrderByUpdatedAtDesc();
}
