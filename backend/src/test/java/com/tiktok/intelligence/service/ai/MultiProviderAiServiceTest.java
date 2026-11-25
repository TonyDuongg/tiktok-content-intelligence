package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.net.http.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MultiProviderAiServiceTest {
    final ObjectMapper mapper = new ObjectMapper();
    final MockEnvironment env = new MockEnvironment();
    final HttpClient http = mock(HttpClient.class);
    final GeminiAiScriptGenerator gemini = mock(GeminiAiScriptGenerator.class);
    MultiProviderAiService ai;
    @BeforeEach void setup() {
        ai = new MultiProviderAiService(env, mapper, new AiScriptPromptBuilder(), new GeneratedScriptParser(mapper), gemini);
        ReflectionTestUtils.setField(ai, "httpClient", http);
    }
    @SuppressWarnings("unchecked") HttpResponse<String> response(int status, Object body) throws Exception {
        HttpResponse<String> result = mock(HttpResponse.class);
        when(result.statusCode()).thenReturn(status); when(result.body()).thenReturn(mapper.writeValueAsString(body)); return result;
    }
    Map<String, Object> script() { return Map.of("title", "Desk tips", "targetAudience", "Students", "hook3s", "Start here", "bodyContent", "[3–27] Clear your desk.",
            "callToAction", "Save this", "visualAndSoundCues", "Show the desk", "suggestedHashtags", List.of("#desk"), "estimatedDurationSeconds", 30); }
    AiSelection choice(String id) { return new AiSelection(id, id + "-test", "request-key"); }
    HttpRequest sent() throws Exception { var capture = ArgumentCaptor.forClass(HttpRequest.class); verify(http).send(capture.capture(), any(HttpResponse.BodyHandler.class)); return capture.getValue(); }

    @Test void geminiCatalogPaginatesAndExcludesOtherModalities() throws Exception {
        doReturn(
                response(200, Map.of("models", List.of(Map.of("name", "models/gemini-text", "displayName", "Text", "supportedGenerationMethods", List.of("generateContent")),
                        Map.of("name", "models/gemini-image", "supportedGenerationMethods", List.of("generateContent")),
                        Map.of("name", "models/gemini-nano-banana-test", "supportedGenerationMethods", List.of("generateContent")),
                        Map.of("name", "models/gemini-test-transcribe", "supportedGenerationMethods", List.of("generateContent")),
                        Map.of("name", "models/embed", "supportedGenerationMethods", List.of("embedContent"))), "nextPageToken", "next+/=")),
                response(200, Map.of("models", List.of(Map.of("name", "models/gemini-other", "supportedGenerationMethods", List.of("generateContent")))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.models(choice("gemini"))).extracting(MultiProviderAiService.ModelOption::id).containsExactly("gemini-other", "gemini-text");
        var capture = ArgumentCaptor.forClass(HttpRequest.class); verify(http, times(2)).send(capture.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(capture.getAllValues().get(1).uri().toString()).contains("pageToken=next%2B%2F%3D").doesNotContain("request-key");
        assertThat(capture.getValue().headers().firstValue("x-goog-api-key")).hasValue("request-key");
    }
    @Test void openaiAndXaiCatalogsKeepTextModelsOnly() throws Exception {
        doReturn(response(200, Map.of("data", List.of(Map.of("id", "gpt-test"), Map.of("id", "gpt-test-audio"), Map.of("id", "embedding-test"))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.models(choice("openai"))).extracting(MultiProviderAiService.ModelOption::id).containsExactly("gpt-test");
        reset(http);
        doReturn(response(200, Map.of("models", List.of(Map.of("id", "grok-test", "output_modalities", List.of("text")), Map.of("id", "grok-image", "output_modalities", List.of("image")))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.models(choice("xai"))).extracting(MultiProviderAiService.ModelOption::id).containsExactly("grok-test");
        assertThat(sent().uri().toString()).isEqualTo("https://api.x.ai/v1/language-models");
    }
    @Test void claudeCatalogUsesProviderPaginationAndVersion() throws Exception {
        doReturn(
                response(200, Map.of("data", List.of(Map.of("id", "claude-first", "display_name", "First")), "has_more", true, "last_id", "claude-first")),
                response(200, Map.of("data", List.of(Map.of("id", "claude-second")), "has_more", false))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.models(choice("anthropic"))).hasSize(2);
        var capture = ArgumentCaptor.forClass(HttpRequest.class); verify(http, times(2)).send(capture.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(capture.getValue().headers().firstValue("anthropic-version")).hasValue("2026-10-21");
        assertThat(capture.getValue().uri().toString()).contains("after_id=claude-first");
    }
    @Test void openaiResponseExtractsTextAndDoesNotStorePrompts() throws Exception {
        doReturn(response(200, Map.of("status", "completed", "model", "gpt-returned",
                "output", List.of(Map.of("type", "reasoning"), Map.of("type", "message", "content", List.of(Map.of("type", "output_text", "text", mapper.writeValueAsString(script())))))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        var result = ai.generate(choice("openai"), "Topic", "Students", "Clear", List.of(), 30);
        assertThat(result.aiModelUsed()).isEqualTo("openai-gpt-returned");
        HttpRequest request = sent(); assertThat(request.uri().toString()).isEqualTo("https://api.openai.com/v1/responses");
        assertThat(request.headers().firstValue("Authorization")).hasValue("Bearer request-key");
        // Inspect actual serialized body, including store:false and no unsupported temperature.
        var body = new java.io.ByteArrayOutputStream();
        request.bodyPublisher().orElseThrow().subscribe(new java.util.concurrent.Flow.Subscriber<>() {
            public void onSubscribe(java.util.concurrent.Flow.Subscription s) { s.request(Long.MAX_VALUE); }
            public void onNext(java.nio.ByteBuffer b) { byte[] bytes = new byte[b.remaining()]; b.get(bytes); body.writeBytes(bytes); }
            public void onError(Throwable t) { throw new AssertionError(t); } public void onComplete() {}
        });
        var json = mapper.readTree(body.toByteArray()); assertThat(json.path("store").asBoolean(true)).isFalse();
        assertThat(json.path("input").asText()).contains("Write all generated script fields in English"); assertThat(json.has("temperature")).isFalse();
    }
    @Test void claudeAndGrokExtractOnlyCompletedText() throws Exception {
        doReturn(response(200, Map.of("stop_reason", "end_turn", "model", "claude-returned", "content", List.of(Map.of("type", "thinking", "thinking", "private"), Map.of("type", "text", "text", mapper.writeValueAsString(script())))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.generate(choice("anthropic"), "Topic", "Students", "Clear", List.of(), 30).title()).isEqualTo("Desk tips");
        assertThat(sent().uri().toString()).isEqualTo("https://api.anthropic.com/v1/messages"); reset(http);
        doReturn(response(200, Map.of("choices", List.of(Map.of("finish_reason", "stop", "message", Map.of("content", mapper.writeValueAsString(script()))))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThat(ai.generate(choice("xai"), "Topic", "Students", "Clear", List.of(), 30).aiModelUsed()).startsWith("xai-");
    }
    @Test void incompleteOutputAndRawProviderErrorsNeverBecomeScriptsOrExposeKeys() throws Exception {
        doReturn(response(200, Map.of("status", "incomplete", "output", List.of()))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThatThrownBy(() -> ai.generate(choice("openai"), "Topic", "Audience", "Tone", List.of(), 30)).isInstanceOf(UpstreamServiceException.class).hasMessageContaining("no script was saved");
        reset(http); doReturn(response(401, Map.of("error", "request-key"))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        assertThatThrownBy(() -> ai.models(choice("xai"))).hasMessageContaining("denied access").hasMessageNotContaining("request-key");
    }
    @Test void credentialsAreRequestScopedAndCannotCrossProviders() throws Exception {
        env.setProperty("application.ai.gemini-api-key", "server-gemini"); env.setProperty("application.ai.openai-api-key", "server-openai");
        doReturn(response(200, Map.of("data", List.of(Map.of("id", "gpt-test"))))).when(http).send(any(), any(HttpResponse.BodyHandler.class));
        ai.models(new AiSelection("openai", null, null)); assertThat(sent().headers().firstValue("Authorization")).hasValue("Bearer server-openai");
        assertThat(new AiSelection("openai", "gpt-test", "private-key").toString()).doesNotContain("private-key");
        assertThatThrownBy(() -> ai.models(new AiSelection("openai", null, ""))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> ai.models(choice("https://evil.example"))).isInstanceOf(ResponseStatusException.class);
    }
    @Test void geminiUsesTheSelectedModelAndKeyWithoutMutatingGlobalConfiguration() {
        ai.generate(choice("gemini"), "Topic", "Students", "Clear", List.of(), 30);
        verify(gemini).generateWithCredentials("Topic", "Students", "Clear", List.of(), 30, "request-key", "gemini-test");
        verifyNoInteractions(http);
    }
}
