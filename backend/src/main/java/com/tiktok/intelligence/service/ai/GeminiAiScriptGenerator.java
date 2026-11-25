package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpTimeoutException;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiAiScriptGenerator implements AiScriptGeneratorClient {
    private static final Duration GENERATION_TIMEOUT = Duration.ofSeconds(120);
    private final AiScriptPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;
    private final GeneratedScriptParser parser;

    @Value("${application.ai.gemini-api-key:}")
    private String apiKey;
    @Value("${application.ai.gemini-model:gemini-3.5-flash}")
    private String model;

    private HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    @Override
    public boolean supports(String provider) {
        return "gemini".equalsIgnoreCase(provider) || "google".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String audience, String tone, List<TikTokVideo> references, int durationSeconds) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new UpstreamServiceException("Gemini is not configured. Add your API key in desktop Settings or set GEMINI_API_KEY and restart the backend.");
        }
        if (model == null || !model.matches("[A-Za-z0-9._-]+")) {
            throw new UpstreamServiceException("Invalid GEMINI_MODEL. Check the configured model name.");
        }
        long started = System.nanoTime();
        try {
            var payload = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", promptBuilder.buildPrompt(nicheName, audience, tone, references, durationSeconds))))),
                    "generationConfig", Map.of("responseMimeType", "application/json", "responseSchema", parser.schema(), "temperature", 0.7));
            var request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent"))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey.trim())
                    .timeout(GENERATION_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Gemini request failed, HTTP {}", response.statusCode());
                throw switch (response.statusCode()) {
                    case 401, 403 -> new UpstreamServiceException("Gemini denied access. Check your API key and Google AI project permissions.");
                    case 404 -> new UpstreamServiceException("Gemini could not find the configured model. Check GEMINI_MODEL.");
                    case 429 -> new UpstreamServiceException("Gemini quota or rate limit reached. Check your quota and try again later.");
                    default -> new UpstreamServiceException("Gemini is unavailable (HTTP " + response.statusCode() + "). Try again later.");
                };
            }
            var root = objectMapper.readTree(response.body());
            if (root == null || !root.isObject()) {
                throw new UpstreamServiceException("Gemini returned invalid data. The script was not saved; try again.");
            }
            var candidate = root.path("candidates").path(0);
            if (!"STOP".equals(candidate.path("finishReason").asText())) {
                throw new UpstreamServiceException("Gemini did not complete the script. Adjust the topic or try again.");
            }
            var text = new StringBuilder();
            for (var part : candidate.path("content").path("parts")) {
                if (!part.path("thought").asBoolean(false)) text.append(part.path("text").asText(""));
            }
            var result = parser.parse(text.toString(), "google-" + root.path("modelVersion").asText(model));
            log.info("Gemini generation completed: model={}, elapsedMs={}", model, elapsedMillis(started));
            return result;
        } catch (UpstreamServiceException ex) { throw ex; }
        catch (HttpConnectTimeoutException ex) {
            log.warn("Gemini connection timed out: elapsedMs={}", elapsedMillis(started));
            throw new UpstreamServiceException("Connection to Gemini timed out. Check your network and try again; the script was not saved.");
        } catch (HttpTimeoutException ex) {
            log.warn("Gemini generation timed out: model={}, elapsedMs={}", model, elapsedMillis(started));
            throw new UpstreamServiceException("Gemini did not respond within 2 minutes. The script was not saved. Try again in a few minutes.");
        } catch (JsonProcessingException ex) {
            log.warn("Gemini returned invalid JSON: elapsedMs={}", elapsedMillis(started));
            throw new UpstreamServiceException("Gemini returned invalid data. The script was not saved; try again.");
        } catch (IOException ex) {
            log.warn("Gemini connection failed ({}): elapsedMs={}", ex.getClass().getSimpleName(), elapsedMillis(started));
            throw new UpstreamServiceException("The Gemini connection was interrupted. Check your network and try again; the script was not saved.");
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new UpstreamServiceException("Script generation was interrupted. Try again.");
        } catch (Exception ex) {
            log.warn("Gemini request could not complete ({})", ex.getClass().getSimpleName());
            throw new UpstreamServiceException("Unable to connect to Gemini or read its response. Try again.");
        }
    }

    private long elapsedMillis(long started) {
        return Duration.ofNanos(System.nanoTime() - started).toMillis();
    }
}
