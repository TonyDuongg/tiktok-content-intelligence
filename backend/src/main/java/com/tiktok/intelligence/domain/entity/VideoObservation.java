package com.tiktok.intelligence.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "video_observations", indexes = @Index(name = "idx_observation_video_time", columnList = "video_id,observed_at"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VideoObservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "video_id", nullable = false) private TikTokVideo video;
    @Column(name = "observed_at", nullable = false) private Instant observedAt;
    @Column(nullable = false) private Long viewCount;
}
