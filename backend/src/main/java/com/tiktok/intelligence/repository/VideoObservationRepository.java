package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.VideoObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface VideoObservationRepository extends JpaRepository<VideoObservation, Long> {
    List<VideoObservation> findByVideoIdInAndObservedAtGreaterThanEqualOrderByObservedAtAsc(List<Long> ids, Instant since);
}
