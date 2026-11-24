package com.tiktok.intelligence.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class DesktopCorsTest {
    @Test
    void desktopRejectsOtherWebsitesWhileAllowingItsOwnOrigin() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "desktopOrigin", "http://127.0.0.1:18761");
        var cors = config.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest("POST", "/api/v1/scripts/generate"));
        assertThat(cors).isNotNull();
        assertThat(cors.checkOrigin("http://127.0.0.1:18761")).isEqualTo("http://127.0.0.1:18761");
        assertThat(cors.checkOrigin("https://other.example")).isNull();
        assertThat(cors.checkOrigin("null")).isNull();
    }
}
