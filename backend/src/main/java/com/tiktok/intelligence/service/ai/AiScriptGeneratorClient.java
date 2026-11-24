package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;

import java.util.List;

public interface AiScriptGeneratorClient {
    default GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos) {
        return generateScript(nicheName, targetAudience, tone, referenceVideos, 60);
    }
    GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos, int durationSeconds);
    boolean supports(String provider);
}
