package com.tiktok.intelligence.service;

import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.service.auth.CustomUserDetails;
import com.tiktok.intelligence.service.auth.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);
    }

    @Test
    @DisplayName("Verify token issuance and claim extraction")
    void testTokenGenerationAndExtraction() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("creator@example.com")
                .passwordHash("encoded_secret")
                .role(UserRole.ROLE_USER)
                .isActive(true)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);
        Map<String, Object> claims = Map.of("userId", userId.toString());

        String token = jwtService.generateToken(claims, userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("creator@example.com");
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }
}
