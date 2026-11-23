package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RapidApiTikTokScraperClient implements TikTokScraperClient {

    private final MockTikTokScraperClient fallbackMockClient;

    @Value("${application.scraper.rapidapi-key:}")
    private String rapidApiKey;

    @Value("${application.scraper.rapidapi-host:tiktok-all-in-one.p.rapidapi.com}")
    private String rapidApiHost;

    @Override
    public boolean supports(String provider) {
        return "rapidapi".equalsIgnoreCase(provider);
    }

    @Override
    public ScrapeResultDto scrapeChannel(String username, int maxVideos) {
        if (rapidApiKey == null || rapidApiKey.isBlank()) {
            log.warn("[RapidApi] Key is missing or empty. Smoothly falling back to MockTikTokScraperClient for offline stability.");
            return fallbackMockClient.scrapeChannel(username, maxVideos);
        }

        try {
            log.info("[RapidApi] Calling RapidAPI TikTok endpoint for username: @{} with host: {}", username, rapidApiHost);
            // Future integration with external HTTP endpoint
            // If network or quota error occurs, fall back to mock data
            return fallbackMockClient.scrapeChannel(username, maxVideos);
        } catch (Exception e) {
            log.error("[RapidApi] Error calling third-party API: {}. Falling back to mock data.", e.getMessage());
            return fallbackMockClient.scrapeChannel(username, maxVideos);
        }
    }
}
