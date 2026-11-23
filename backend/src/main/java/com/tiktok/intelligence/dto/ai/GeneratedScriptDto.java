package com.tiktok.intelligence.dto.ai;

import java.util.List;

public record GeneratedScriptDto(
        String title,
        String targetAudience,
        String hook3s,
        String bodyContent,
        String callToAction,
        String visualAndSoundCues,
        List<String> suggestedHashtags,
        Integer estimatedDurationSeconds,
        String aiModelUsed
) {
}
