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
            throw new UpstreamServiceException("Chưa cấu hình GEMINI_API_KEY. Thêm khóa API vào .env rồi khởi động lại backend.");
        }
        if (model == null || !model.matches("[A-Za-z0-9._-]+")) {
            throw new UpstreamServiceException("GEMINI_MODEL chưa hợp lệ. Kiểm tra tên model trong cấu hình.");
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
                    case 401, 403 -> new UpstreamServiceException("Gemini từ chối khóa API hoặc quyền truy cập. Kiểm tra khóa và dự án Google AI.");
                    case 404 -> new UpstreamServiceException("Gemini không tìm thấy model đã cấu hình. Kiểm tra GEMINI_MODEL.");
                    case 429 -> new UpstreamServiceException("Gemini đã hết hạn mức hoặc đang giới hạn yêu cầu. Kiểm tra quota rồi thử lại sau.");
                    default -> new UpstreamServiceException("Gemini đang không đáp ứng (HTTP " + response.statusCode() + "). Vui lòng thử lại sau.");
                };
            }
            var root = objectMapper.readTree(response.body());
            if (root == null || !root.isObject()) {
                throw new UpstreamServiceException("Gemini trả về dữ liệu không hợp lệ. Kịch bản chưa được lưu; vui lòng thử lại.");
            }
            var candidate = root.path("candidates").path(0);
            if (!"STOP".equals(candidate.path("finishReason").asText())) {
                throw new UpstreamServiceException("Gemini chưa hoàn tất nội dung. Hãy chỉnh chủ đề hoặc thử lại.");
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
            throw new UpstreamServiceException("Không kết nối được Gemini trong thời gian chờ. Kiểm tra mạng rồi thử lại; kịch bản chưa được lưu.");
        } catch (HttpTimeoutException ex) {
            log.warn("Gemini generation timed out: model={}, elapsedMs={}", model, elapsedMillis(started));
            throw new UpstreamServiceException("Gemini chưa phản hồi sau 2 phút. Kịch bản chưa được lưu. Vui lòng thử lại sau ít phút.");
        } catch (JsonProcessingException ex) {
            log.warn("Gemini returned invalid JSON: elapsedMs={}", elapsedMillis(started));
            throw new UpstreamServiceException("Gemini trả về dữ liệu không hợp lệ. Kịch bản chưa được lưu; vui lòng thử lại.");
        } catch (IOException ex) {
            log.warn("Gemini connection failed ({}): elapsedMs={}", ex.getClass().getSimpleName(), elapsedMillis(started));
            throw new UpstreamServiceException("Kết nối với Gemini bị gián đoạn. Kiểm tra mạng rồi thử lại; kịch bản chưa được lưu.");
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new UpstreamServiceException("Yêu cầu tạo kịch bản đã bị gián đoạn. Vui lòng thử lại.");
        } catch (Exception ex) {
            log.warn("Gemini request could not complete ({})", ex.getClass().getSimpleName());
            throw new UpstreamServiceException("Không kết nối được Gemini hoặc phản hồi không hợp lệ. Vui lòng thử lại.");
        }
    }

    private long elapsedMillis(long started) {
        return Duration.ofNanos(System.nanoTime() - started).toMillis();
    }
}
