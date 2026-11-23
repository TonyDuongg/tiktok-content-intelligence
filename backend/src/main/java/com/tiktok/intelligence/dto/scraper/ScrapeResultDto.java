package com.tiktok.intelligence.dto.scraper;

import java.time.Instant;
import java.util.List;

public record ScrapeResultDto(
        TikTokChannelProfileDto channel,
        List<TikTokVideoDto> videos,
        Instant scrapedAt
) {
    public static ScrapeResultDto of(TikTokChannelProfileDto channel, List<TikTokVideoDto> videos) {
        return new ScrapeResultDto(channel, videos, Instant.now());
    }
}
