package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import com.tiktok.intelligence.dto.scraper.TikTokVideoDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MockTikTokScraperClientTest {

    private MockTikTokScraperClient scraperClient;

    @BeforeEach
    void setUp() {
        scraperClient = new MockTikTokScraperClient();
    }

    @Test
    @DisplayName("Verify mock scraping produces valid channel profile and videos")
    void testScrapeChannel() {
        ScrapeResultDto result = scraperClient.scrapeChannel("beautytips_vn", 5);

        assertThat(result).isNotNull();
        assertThat(result.channel()).isNotNull();
        assertThat(result.channel().username()).isEqualTo("beautytips_vn");
        assertThat(result.channel().followersCount()).isGreaterThan(0L);

        assertThat(result.videos()).hasSize(5);

        TikTokVideoDto firstVideo = result.videos().get(0);
        assertThat(firstVideo.videoId()).isNotBlank();
        assertThat(firstVideo.caption()).isNotBlank();
        assertThat(firstVideo.transcript()).isNotBlank();
        assertThat(firstVideo.hashtags()).isNotEmpty();

        BigDecimal engagementRate = firstVideo.calculateEngagementRate();
        assertThat(engagementRate).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void sampleMetricsAreStableAndRequestedLimitIsSupported() {
        var first = scraperClient.scrapeChannel("@creator", 50);
        var second = scraperClient.scrapeChannel("creator", 50);
        assertThat(first.videos()).hasSize(50);
        assertThat(first.videos().getFirst().viewCount()).isEqualTo(second.videos().getFirst().viewCount());
        assertThat(first.videos().getFirst().videoUrl()).isEmpty();
        assertThat(first.videos().getFirst().videoId()).isNotEqualTo(scraperClient.scrapeChannel("other_creator", 1).videos().getFirst().videoId());
    }
}
