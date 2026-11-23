package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiAiScriptGenerator implements AiScriptGeneratorClient {

    private final MockAiScriptGenerator fallbackMockGenerator;
    private final AiScriptPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Value("${application.ai.gemini-api-key:}")
    private String apiKey;

    @Value("${application.ai.gemini-model:gemini-1.5-flash}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Override
    public boolean supports(String provider) {
        return "gemini".equalsIgnoreCase(provider) || "google".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("[GeminiAI] GEMINI_API_KEY chưa được cấu hình. Hệ thống tự động chuyển sang Mock AI Generator.");
            return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);
        }

        try {
            log.info("[GeminiAI] Đang gọi Google Gemini API (model: {}) để sinh kịch bản TikTok viral...", model);
            String prompt = promptBuilder.buildPrompt(nicheName, targetAudience, tone, referenceVideos);

            // Construct Gemini generateContent payload with structured JSON output
            Map<String, Object> requestPayload = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.7
                    )
            );

            String requestBody = objectMapper.writeValueAsString(requestPayload);
            String endpoint = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    model, apiKey.trim());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(45))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("[GeminiAI] Gọi Gemini API thất bại (HTTP {}): {}. Tự động fallback sang Mock.",
                        response.statusCode(), response.body());
                return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);
            }

            var root = objectMapper.readTree(response.body());
            var parts = root.path("candidates").get(0).path("content").path("parts");
            if (parts.isMissingNode() || parts.isEmpty()) {
                log.warn("[GeminiAI] Không tìm thấy nội dung phản hồi từ Gemini. Fallback sang Mock.");
                return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);
            }

            String textResponse = parts.get(0).path("text").asText();
            int startIdx = textResponse.indexOf("{");
            int endIdx = textResponse.lastIndexOf("}");
            if (startIdx >= 0 && endIdx > startIdx) {
                String cleanJson = textResponse.substring(startIdx, endIdx + 1);
                var scriptDto = objectMapper.readValue(cleanJson, GeneratedScriptDto.class);
                return new GeneratedScriptDto(
                        scriptDto.title(),
                        scriptDto.targetAudience(),
                        scriptDto.hook3s(),
                        scriptDto.bodyContent(),
                        scriptDto.callToAction(),
                        scriptDto.visualAndSoundCues(),
                        scriptDto.suggestedHashtags(),
                        scriptDto.estimatedDurationSeconds(),
                        "google-" + model
                );
            }

            return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);

        } catch (Exception e) {
            log.warn("[GeminiAI] Lỗi khi tương tác với Gemini API: {}. Tự động fallback sang Mock AI Generator.", e.getMessage());
            return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);
        }
    }
}
