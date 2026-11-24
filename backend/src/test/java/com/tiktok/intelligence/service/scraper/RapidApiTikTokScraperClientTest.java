package com.tiktok.intelligence.service.scraper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RapidApiTikTokScraperClientTest {
    @Test
    void missingCredentialsNeverReturnInventedChannelData() {
        var client = new RapidApiTikTokScraperClient(new ObjectMapper());
        for (String key : new String[]{"", "your_key_here", "key_cua_ban"}) {
            ReflectionTestUtils.setField(client, "rapidApiKey", key);
            assertThatThrownBy(() -> client.scrapeChannel("creator", 10))
                    .isInstanceOf(UpstreamServiceException.class)
                    .hasMessageContaining("RAPIDAPI_KEY");
        }
    }
}
