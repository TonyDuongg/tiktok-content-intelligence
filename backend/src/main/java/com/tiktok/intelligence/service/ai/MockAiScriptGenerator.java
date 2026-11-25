package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Slf4j
@Component
@Profile("test")
public class MockAiScriptGenerator implements AiScriptGeneratorClient {

    @Override
    public boolean supports(String provider) {
        return "mock".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos, int durationSeconds) {
        log.info("[MockAiGenerator] Generating AI viral TikTok script for niche: '{}', audience: '{}'", nicheName, targetAudience);

        String topic = (nicheName != null && !nicheName.isBlank()) ? nicheName.lines().findFirst().orElse("Video idea") : "Video idea";

        return new GeneratedScriptDto(
                "Sample: " + topic.substring(0, Math.min(topic.length(), 160)),
                targetAudience != null ? targetAudience : "TikTok viewers",
                "Exploring " + topic + "? Start here.",
                "[3–10 sec] Introduce a practical problem about: " + topic + ".\n\n"
                        + "[10–25 sec] Share 2–3 points, each supported by a verified example.\n\n"
                        + "[25–30 sec] Demonstrate an application and recap the main point.\n\n"
                        + "This is a test sample. Add real content before filming.",
                "Save this to try and share your experience in the comments.",
                "Open with a close-up. Illustrate each point with readable captions and quiet background music.",
                List.of("#contentcreation", "#learning"),
                durationSeconds,
                "mock-template"
        );
    }
}
