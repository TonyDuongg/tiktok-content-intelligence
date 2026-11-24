package com.tiktok.intelligence.service.scraper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TikTokScraperFactory {

    private final List<TikTokScraperClient> scraperClients;

    @Value("${application.scraper.provider:rapidapi}")
    private String activeProvider;

    public TikTokScraperClient getScraperClient() {
        return scraperClients.stream()
                .filter(client -> client.supports(activeProvider))
                .findFirst()
                .orElseThrow(() -> new com.tiktok.intelligence.exception.UpstreamServiceException(
                        "Nguồn TikTok chưa hợp lệ. Cấu hình SCRAPER_PROVIDER=rapidapi."));
    }
}
