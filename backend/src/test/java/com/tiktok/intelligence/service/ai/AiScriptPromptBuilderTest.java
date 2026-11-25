package com.tiktok.intelligence.service.ai;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class AiScriptPromptBuilderTest {
    private final AiScriptPromptBuilder builder = new AiScriptPromptBuilder();

    @Test
    void durationControlsSpeechBudgetSceneAllocationAndOutput() {
        String shortVideo = builder.buildPrompt("Chăm sóc da", "Sinh viên", "Rõ ràng", List.of(), 15);
        String longVideo = builder.buildPrompt("Chăm sóc da", "Sinh viên", "Rõ ràng", List.of(), 180);
        assertThat(shortVideo).contains("Write all generated script fields in English", "Chăm sóc da", "Sinh viên", "Target duration: 15 seconds", "36–45", "3–12 seconds", "12–15 seconds", "1–2 paragraphs", "\"estimatedDurationSeconds\": 15");
        assertThat(longVideo).contains("Target duration: 180 seconds", "432–540", "3–175 seconds", "175–180 seconds", "6–10 paragraphs", "\"estimatedDurationSeconds\": 180");
        assertThatThrownBy(() -> builder.buildPrompt("Topic", "Audience", "Tone", List.of(), 601))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
