package com.tiktok.intelligence.dto.response;

import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.UserRole;

import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        Integer creditsBalance
) {
    public static UserDto fromEntity(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getCreditsBalance()
        );
    }
}
