package com.tiktok.intelligence.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Entity
@Table(name = "tiktok_channels", indexes = {
    @Index(name = "idx_channels_username", columnList = "tiktok_username"),
    @Index(name = "idx_channels_category", columnList = "category_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TikTokChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Category category;

    @Column(name = "tiktok_username", nullable = false, unique = true, length = 100)
    private String tiktokUsername;

    @Column(name = "sec_uid", length = 255)
    private String secUid;

    @Column(name = "nickname", length = 150)
    private String nickname;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "followers_count")
    @Builder.Default
    private Long followersCount = 0L;

    @Column(name = "total_likes")
    @Builder.Default
    private Long totalLikes = 0L;

    @Column(name = "total_videos")
    @Builder.Default
    private Integer totalVideos = 0;

    @Column(name = "last_scraped_at")
    private Instant lastScrapedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Helper compatibility getters for frontend
    public Long getFollowerCount() {
        return followersCount != null ? followersCount : 0L;
    }

    public Long getLikeCount() {
        return totalLikes != null ? totalLikes : 0L;
    }

    public BigDecimal getAverageEngagementRate() {
        if (followersCount != null && followersCount > 0 && totalLikes != null && totalVideos != null && totalVideos > 0) {
            double avgLikesPerVideo = (double) totalLikes / totalVideos;
            return BigDecimal.valueOf((avgLikesPerVideo / followersCount) * 100.0)
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
