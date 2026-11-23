package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;

import java.util.List;

public interface AiScriptGeneratorClient {
    GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos);
    boolean supports(String provider);
}
