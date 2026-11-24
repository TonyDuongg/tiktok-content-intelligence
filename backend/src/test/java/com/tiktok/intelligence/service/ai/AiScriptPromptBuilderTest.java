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
        assertThat(shortVideo).contains("Thời lượng mục tiêu: 15 giây", "36–45", "3–12 giây", "12–15 giây", "1–2 đoạn", "\"estimatedDurationSeconds\": 15");
        assertThat(longVideo).contains("Thời lượng mục tiêu: 180 giây", "432–540", "3–175 giây", "175–180 giây", "6–10 đoạn", "\"estimatedDurationSeconds\": 180");
        assertThatThrownBy(() -> builder.buildPrompt("Topic", "Audience", "Tone", List.of(), 601))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
