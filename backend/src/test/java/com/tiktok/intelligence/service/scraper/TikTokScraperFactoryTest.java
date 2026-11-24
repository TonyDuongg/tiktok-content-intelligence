package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.exception.UpstreamServiceException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TikTokScraperFactoryTest {
    @Test
    void invalidProviderDoesNotFallBackToSampleData() {
        TikTokScraperClient client = mock(TikTokScraperClient.class);
        var factory = new TikTokScraperFactory(List.of(client));
        ReflectionTestUtils.setField(factory, "activeProvider", "invalid-provider");
        assertThatThrownBy(factory::getScraperClient).isInstanceOf(UpstreamServiceException.class);
        verify(client, never()).supports("mock");
    }
}
