package com.tiktok.intelligence.dto.scraper;

public record TikTokChannelProfileDto(
        String username,
        String nickname,
        String avatarUrl,
        String bio,
        Long followersCount,
        Long totalLikes,
        Integer totalVideos
) {
}
