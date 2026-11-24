package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GeminiAiScriptGeneratorTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final AiScriptPromptBuilder prompt = new AiScriptPromptBuilder();
    private final HttpClient http = mock(HttpClient.class);
    private GeminiAiScriptGenerator generator;

    @BeforeEach
    void setup() {
        generator = new GeminiAiScriptGenerator(prompt, mapper, new GeneratedScriptParser(mapper));
        ReflectionTestUtils.setField(generator, "httpClient", http);
        ReflectionTestUtils.setField(generator, "apiKey", "test-credential");
        ReflectionTestUtils.setField(generator, "model", "gemini-3.5-flash");
    }

    @Test
    void supportsRealProvidersOnly() {
        assertThat(generator.supports("gemini")).isTrue();
        assertThat(generator.supports("google")).isTrue();
        assertThat(generator.supports("mock")).isFalse();
    }

    @Test
    void missingKeyIsAnErrorWithoutAnyRequest() {
        ReflectionTestUtils.setField(generator, "apiKey", "");
        assertThatThrownBy(() -> generator.generateScript("Topic", "Audience", "Tone", List.of()))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("GEMINI_API_KEY");
        verifyNoInteractions(http);
    }

    @Test
    @SuppressWarnings("unchecked")
    void rateLimitNeverReturnsTemplateContent() throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(429);
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        assertThatThrownBy(() -> generator.generateScript("Topic", "Audience", "Tone", List.of()))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("hạn mức");
    }

    @Test
    @SuppressWarnings("unchecked")
    void timeoutExplainsThatNothingWasSavedAndDoesNotRetry() throws Exception {
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new HttpTimeoutException("request timed out"));
        assertThatThrownBy(() -> generator.generateScript("Topic", "Audience", "Tone", List.of()))
                .isInstanceOf(UpstreamServiceException.class)
                .hasMessageContaining("sau 2 phút").hasMessageContaining("chưa được lưu");
        ArgumentCaptor<HttpRequest> request = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http, times(1)).send(request.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(request.getValue().timeout()).contains(Duration.ofSeconds(120));
    }

    @Test
    @SuppressWarnings("unchecked")
    void connectionTimeoutHasItsOwnMessage() throws Exception {
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new HttpConnectTimeoutException("connect timed out"));
        assertThatThrownBy(() -> generator.generateScript("Topic", "Audience", "Tone", List.of()))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("Kiểm tra mạng");
    }

    @Test
    @SuppressWarnings("unchecked")
    void malformedResponseDoesNotLookLikeNetworkFailure() throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("<html>upstream error</html>");
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        assertThatThrownBy(() -> generator.generateScript("Topic", "Audience", "Tone", List.of()))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("dữ liệu không hợp lệ");
    }

    @Test
    @SuppressWarnings("unchecked")
    void parsesRealResponseAndKeepsCredentialOutOfUrl() throws Exception {
        String script = mapper.writeValueAsString(Map.of("title", "Chủ đề thực", "targetAudience", "Sinh viên",
                "hook3s", "Hook", "bodyContent", "Lời thoại", "callToAction", "Lưu lại", "visualAndSoundCues", "Cận cảnh",
                "suggestedHashtags", List.of("#video"), "estimatedDurationSeconds", 40));
        String body = mapper.writeValueAsString(Map.of("modelVersion", "gemini-3.5-flash", "candidates",
                List.of(Map.of("finishReason", "STOP", "content", Map.of("parts", List.of(Map.of("text", script)))))));
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn(body);
        when(http.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        var result = generator.generateScript("Topic", "Audience", "Tone", List.of());
        assertThat(result.title()).isEqualTo("Chủ đề thực");
        assertThat(result.aiModelUsed()).isEqualTo("google-gemini-3.5-flash");
        ArgumentCaptor<HttpRequest> request = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).send(request.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(request.getValue().uri().getQuery()).isNull();
        assertThat(request.getValue().headers().firstValue("x-goog-api-key")).contains("test-credential");
    }
}
