package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Component
@RequiredArgsConstructor
public class MultiProviderAiService implements AiScriptGeneratorClient {
    private final Environment environment;
    private final ObjectMapper mapper;
    private final AiScriptPromptBuilder promptBuilder;
    private final GeneratedScriptParser parser;
    private final GeminiAiScriptGenerator gemini;
    private HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private static final Map<String, String> BASES = Map.of(
            "gemini", "https://generativelanguage.googleapis.com/v1beta",
            "openai", "https://api.openai.com/v1", "anthropic", "https://api.anthropic.com/v1",
            "xai", "https://api.x.ai/v1");
    public record ModelOption(String id, String name) {}
    public record ProviderInfo(String id, String name, boolean configured, String model) {}

    public String provider(String value) {
        String id = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!BASES.containsKey(id)) throw bad("Choose Gemini, OpenAI, Anthropic or xAI.");
        return id;
    }
    public String model(String id) {
        return environment.getProperty("application.ai." + id + "-model", "gemini".equals(id) ? "gemini-3.5-flash" : "");
    }
    private String key(String id, String supplied) {
        String value = supplied == null ? environment.getProperty("application.ai." + id + "-api-key", "") : supplied;
        if (value.isBlank()) throw bad("Add an API key for " + label(id) + " before loading models or generating a script.");
        if (value.length() > 4096 || value.chars().anyMatch(c -> c < 32 || c > 126)) throw bad("Invalid API key. Check it and try again.");
        return value.trim();
    }
    private String validateModel(String value) {
        if (value == null || !value.matches("[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}") || value.contains(".."))
            throw bad("Choose a model or enter a valid model ID.");
        return value;
    }
    public List<ProviderInfo> providers() {
        return List.of("gemini", "openai", "anthropic", "xai").stream().map(id -> new ProviderInfo(id,
                label(id), !environment.getProperty("application.ai." + id + "-api-key", "").isBlank(), model(id))).toList();
    }
    private String label(String id) { return switch (id) { case "openai" -> "OpenAI"; case "anthropic" -> "Anthropic"; case "xai" -> "xAI"; default -> "Gemini"; }; }
    @Override public boolean supports(String value) { return value != null && List.of("openai", "anthropic", "xai").contains(value.toLowerCase(Locale.ROOT)); }
    @Override public GeneratedScriptDto generateScript(String topic, String audience, String tone, List<TikTokVideo> refs, int seconds) {
        return generate(new AiSelection(environment.getProperty("application.ai.provider", "gemini"), null, null), topic, audience, tone, refs, seconds);
    }

    public List<ModelOption> models(AiSelection selection) {
        String id = provider(selection.provider());
        String apiKey = key(id, selection.apiKey());
        Map<String, ModelOption> found = new LinkedHashMap<>();
        String cursor = "";
        for (int page = 0; page < 20; page++) {
            String suffix = switch (id) {
                case "gemini" -> "/models?pageSize=1000" + (cursor.isEmpty() ? "" : "&pageToken=" + encode(cursor));
                case "anthropic" -> "/models?limit=100" + (cursor.isEmpty() ? "" : "&after_id=" + encode(cursor));
                case "xai" -> "/language-models";
                default -> "/models";
            };
            JsonNode root = send(id, apiKey, suffix, null, Duration.ofSeconds(30));
            JsonNode entries = root.path(id.equals("gemini") || id.equals("xai") ? "models" : "data");
            if (!entries.isArray()) throw upstream(id, "returned an invalid model catalog. Try refreshing.");
            for (JsonNode item : entries) {
                String modelId = id.equals("gemini") ? item.path("name").asText().replaceFirst("^models/", "") : item.path("id").asText();
                if (!isTextModel(id, modelId, item)) continue;
                String name = item.path(id.equals("anthropic") ? "display_name" : "displayName").asText(modelId);
                found.putIfAbsent(modelId, new ModelOption(modelId, name));
            }
            String next = id.equals("gemini") ? root.path("nextPageToken").asText("")
                    : id.equals("anthropic") && root.path("has_more").asBoolean() ? root.path("last_id").asText("") : "";
            if (id.equals("anthropic") && root.path("has_more").asBoolean() && next.isEmpty()) throw upstream(id, "returned an invalid catalog cursor. Try refreshing.");
            if (next.isEmpty()) return found.values().stream().sorted(Comparator.comparing(ModelOption::id)).toList();
            if (next.equals(cursor)) throw upstream(id, "returned an invalid catalog cursor. Try refreshing.");
            cursor = next;
        }
        throw upstream(id, "returned too many catalog pages. Try again later.");
    }
    private boolean isTextModel(String provider, String id, JsonNode item) {
        if (id.isBlank() || !id.matches("[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}")) return false;
        String lower = id.toLowerCase(Locale.ROOT);
        if (provider.equals("gemini")) return lower.startsWith("gemini-") && contains(item.path("supportedGenerationMethods"), "generateContent")
                && !lower.matches(".*(image|audio|tts|live|robotics|computer-use|transcribe|nano-banana|omni).*" );
        if (provider.equals("openai")) return (lower.startsWith("gpt-") || lower.matches("o[1-9].*"))
                && !lower.matches(".*(audio|realtime|image|transcribe|tts|search|instruct|codex).*" );
        if (provider.equals("xai")) return contains(item.path("output_modalities"), "text");
        return lower.startsWith("claude-");
    }
    private boolean contains(JsonNode array, String value) { for (JsonNode n : array) if (value.equals(n.asText())) return true; return false; }
    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }

    public GeneratedScriptDto generate(AiSelection selection, String topic, String audience, String tone, List<TikTokVideo> refs, int seconds) {
        String id = provider(selection.provider());
        String apiKey = key(id, selection.apiKey());
        String model = validateModel(selection.model() == null || selection.model().isBlank() ? model(id) : selection.model().trim());
        if (id.equals("gemini")) return gemini.generateWithCredentials(topic, audience, tone, refs, seconds, apiKey, model);
        String prompt = promptBuilder.buildPrompt(topic, audience, tone, refs, seconds);
        int budget = Math.min(16000, Math.max(4096, seconds * 24));
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        String path;
        if (id.equals("openai")) {
            path = "/responses";
            payload.put("input", prompt); payload.put("store", false); payload.put("max_output_tokens", budget);
        } else {
            path = id.equals("anthropic") ? "/messages" : "/chat/completions";
            payload.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            payload.put("max_tokens", budget);
        }
        JsonNode root = send(id, apiKey, path, payload, Duration.ofSeconds(120));
        StringBuilder text = new StringBuilder();
        if (id.equals("openai")) {
            if (!root.path("status").asText().equals("completed")) throw upstream(id, "did not complete the script. Try again; no script was saved.");
            for (JsonNode output : root.path("output")) if (output.path("type").asText().equals("message")) {
                for (JsonNode part : output.path("content")) if (part.path("type").asText().equals("output_text")) text.append(part.path("text").asText());
            }
        } else if (id.equals("anthropic")) {
            if (!root.path("stop_reason").asText().equals("end_turn")) throw upstream(id, "did not complete the script. Try again; no script was saved.");
            for (JsonNode part : root.path("content")) if (part.path("type").asText().equals("text")) text.append(part.path("text").asText());
        } else {
            JsonNode choice = root.path("choices").path(0);
            if (!choice.path("finish_reason").asText().equals("stop")) throw upstream(id, "did not complete the script. Try again; no script was saved.");
            text.append(choice.path("message").path("content").asText());
        }
        return parser.parse(text.toString(), id + "-" + root.path("model").asText(model));
    }
    private JsonNode send(String id, String key, String path, Map<String, Object> payload, Duration timeout) {
        try {
            var builder = HttpRequest.newBuilder(URI.create(BASES.get(id) + path)).timeout(timeout).header("Content-Type", "application/json");
            if (id.equals("gemini")) builder.header("x-goog-api-key", key);
            else builder.header("Authorization", "Bearer " + key);
            if (id.equals("anthropic")) builder.header("anthropic-version", "2026-10-21");
            if (payload == null) builder.GET(); else builder.POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)));
            var response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) throw upstream(id, switch (response.statusCode()) {
                case 400 -> "rejected this model or request. Check model compatibility and permissions.";
                case 401, 403 -> "denied access. Check your API key and permissions.";
                case 404 -> "could not find this model. Refresh the model list or check the model ID.";
                case 429 -> "quota or rate limit reached. Check billing and try again later.";
                default -> "is unavailable (HTTP " + response.statusCode() + "). Try again later.";
            });
            JsonNode root = mapper.readTree(response.body());
            if (root == null || !root.isObject()) throw upstream(id, "returned invalid data. Try again.");
            return root;
        } catch (UpstreamServiceException ex) { throw ex; }
        catch (HttpTimeoutException ex) { throw upstream(id, "request timed out. No script was saved. Try again later."); }
        catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw upstream(id, "request was interrupted. Try again."); }
        catch (Exception ex) { throw upstream(id, "could not be reached or returned invalid data. Check your connection and try again."); }
    }
    private UpstreamServiceException upstream(String id, String reason) { return new UpstreamServiceException(label(id) + " " + reason); }
    private ResponseStatusException bad(String reason) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason); }
}
