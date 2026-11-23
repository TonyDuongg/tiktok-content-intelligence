package com.tiktok.intelligence.dto.response;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long expiresIn,
        UserDto user
) {
    public static AuthResponse of(String token, Long expiresInSeconds, UserDto user) {
        return new AuthResponse(token, "Bearer", expiresInSeconds, user);
    }
}
