package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AwsBedrockAiScriptGenerator implements AiScriptGeneratorClient {

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final MockAiScriptGenerator fallbackMockGenerator;
    private final AiScriptPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Value("${application.ai.model-id:anthropic.claude-3-5-sonnet-20240620-v1:0}")
    private String modelId;

    @Override
    public boolean supports(String provider) {
        return "bedrock".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos) {
        try {
            log.info("[AwsBedrock] Invoking Amazon Bedrock model '{}' for script generation...", modelId);
            String prompt = promptBuilder.buildPrompt(nicheName, targetAudience, tone, referenceVideos);

            // Construct payload for Anthropic Claude via Amazon Bedrock
            Map<String, Object> requestBody = Map.of(
                    "anthropic_version", "bedrock-2023-05-31",
                    "max_tokens", 1024,
                    "temperature", 0.7,
                    "messages", List.of(
                            Map.of("role", "user", "content", prompt)
                    )
            );

            String requestJson = objectMapper.writeValueAsString(requestBody);

            InvokeModelRequest invokeRequest = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestJson))
                    .build();

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(invokeRequest);
            String responseJson = response.body().asString(StandardCharsets.UTF_8);

            // Extract content from Claude response format
            var root = objectMapper.readTree(responseJson);
            String textResponse = root.path("content").get(0).path("text").asText();

            // Extract embedded JSON from LLM response
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
                        modelId
                );
            }

            return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);

        } catch (Exception e) {
            log.warn("[AwsBedrock] Failed to invoke Bedrock model: {}. Smoothly falling back to Mock AI Generator.", e.getMessage());
            return fallbackMockGenerator.generateScript(nicheName, targetAudience, tone, referenceVideos);
        }
    }
}
