package com.tiktok.intelligence.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tiktok_videos", indexes = {
    @Index(name = "idx_videos_channel", columnList = "channel_id"),
    @Index(name = "idx_videos_engagement", columnList = "engagement_rate"),
    @Index(name = "idx_videos_published_at", columnList = "video_published_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TikTokVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private TikTokChannel channel;

    @Column(name = "tiktok_video_id", nullable = false, unique = true, length = 100)
    private String tiktokVideoId;

    @Column(name = "video_url", nullable = false, columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hashtags")
    @Builder.Default
    private List<String> hashtags = new ArrayList<>();

    @Column(name = "view_count")
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "like_count")
    @Builder.Default
    private Long likeCount = 0L;

    @Column(name = "comment_count")
    @Builder.Default
    private Long commentCount = 0L;

    @Column(name = "share_count")
    @Builder.Default
    private Long shareCount = 0L;

    @Column(name = "engagement_rate", precision = 6, scale = 3)
    @Builder.Default
    private BigDecimal engagementRate = BigDecimal.ZERO;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "sound_title", length = 255)
    private String soundTitle;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "video_published_at")
    private Instant videoPublishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public void calculateEngagementRate() {
        if (viewCount != null && viewCount > 0) {
            long totalInteractions = (likeCount != null ? likeCount : 0) +
                                    (commentCount != null ? commentCount : 0) +
                                    (shareCount != null ? shareCount : 0);
            this.engagementRate = BigDecimal.valueOf((double) totalInteractions / viewCount * 100.0)
                    .setScale(3, java.math.RoundingMode.HALF_UP);
        } else {
            this.engagementRate = BigDecimal.ZERO;
        }
    }
}
