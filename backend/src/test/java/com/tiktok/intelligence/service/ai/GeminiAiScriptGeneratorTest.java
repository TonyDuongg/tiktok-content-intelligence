package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiAiScriptGeneratorTest {

    @Mock
    private MockAiScriptGenerator fallbackMockGenerator;

    @Mock
    private AiScriptPromptBuilder promptBuilder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private GeminiAiScriptGenerator geminiAiScriptGenerator;

    @BeforeEach
    void setUp() {
        geminiAiScriptGenerator = new GeminiAiScriptGenerator(
                fallbackMockGenerator,
                promptBuilder,
                objectMapper
        );
    }

    @Test
    @DisplayName("Verify provider supports 'gemini' and 'google'")
    void testSupportsProvider() {
        assertThat(geminiAiScriptGenerator.supports("gemini")).isTrue();
        assertThat(geminiAiScriptGenerator.supports("GEMINI")).isTrue();
        assertThat(geminiAiScriptGenerator.supports("google")).isTrue();
        assertThat(geminiAiScriptGenerator.supports("bedrock")).isFalse();
        assertThat(geminiAiScriptGenerator.supports("mock")).isFalse();
    }

    @Test
    @DisplayName("Verify graceful fallback when GEMINI_API_KEY is not configured")
    void testFallbackWhenApiKeyEmpty() {
        ReflectionTestUtils.setField(geminiAiScriptGenerator, "apiKey", "");

        GeneratedScriptDto mockDto = new GeneratedScriptDto(
                "Mock Title", "Audience", "Hook", "Body", "CTA", "Cues", List.of("#tag"), 30, "mock"
        );
        when(fallbackMockGenerator.generateScript(anyString(), anyString(), anyString(), anyList()))
                .thenReturn(mockDto);

        GeneratedScriptDto result = geminiAiScriptGenerator.generateScript("Mỹ phẩm", "Gen Z", "Hài hước", List.of());

        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("Mock Title");
    }
}
