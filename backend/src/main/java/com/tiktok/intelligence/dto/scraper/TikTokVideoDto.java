package com.tiktok.intelligence.dto.scraper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

public record TikTokVideoDto(
        String videoId,
        String videoUrl,
        String coverImageUrl,
        String caption,
        List<String> hashtags,
        Long viewCount,
        Long likeCount,
        Long commentCount,
        Long shareCount,
        Integer durationSeconds,
        String soundTitle,
        String transcript,
        Instant publishedAt
) {
    public BigDecimal calculateEngagementRate() {
        if (viewCount != null && viewCount > 0) {
            long total = (likeCount != null ? likeCount : 0) +
                         (commentCount != null ? commentCount : 0) +
                         (shareCount != null ? shareCount : 0);
            return BigDecimal.valueOf((double) total / viewCount * 100.0)
                    .setScale(3, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
