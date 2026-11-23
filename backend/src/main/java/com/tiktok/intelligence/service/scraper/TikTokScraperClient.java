package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;

public interface TikTokScraperClient {
    ScrapeResultDto scrapeChannel(String username, int maxVideos);
    boolean supports(String provider);
}
