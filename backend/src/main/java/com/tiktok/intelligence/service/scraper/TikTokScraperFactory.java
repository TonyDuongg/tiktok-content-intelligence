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

    @Value("${application.scraper.provider:mock}")
    private String activeProvider;

    public TikTokScraperClient getScraperClient() {
        return scraperClients.stream()
                .filter(client -> client.supports(activeProvider))
                .findFirst()
                .orElseGet(() -> {
                    log.warn("Scraper provider '{}' not found. Defaulting to mock provider.", activeProvider);
                    return scraperClients.stream()
                            .filter(c -> c.supports("mock"))
                            .findFirst()
                            .orElseThrow(() -> new IllegalStateException("No valid TikTok scraper client found."));
                });
    }
}
