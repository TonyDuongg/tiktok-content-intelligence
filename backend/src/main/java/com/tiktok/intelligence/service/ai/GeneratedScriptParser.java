package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GeneratedScriptParser {
    private final ObjectMapper mapper;
    private static final List<String> TEXT_FIELDS = List.of("title", "targetAudience", "hook3s", "bodyContent", "callToAction", "visualAndSoundCues");

    public Map<String, Object> schema() {
        var properties = new java.util.LinkedHashMap<String, Object>();
        TEXT_FIELDS.forEach(field -> properties.put(field, Map.of("type", "STRING")));
        properties.put("suggestedHashtags", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
        properties.put("estimatedDurationSeconds", Map.of("type", "INTEGER"));
        var required = new ArrayList<>(TEXT_FIELDS);
        required.addAll(List.of("suggestedHashtags", "estimatedDurationSeconds"));
        return Map.of("type", "OBJECT", "properties", properties, "required", required);
    }

    public GeneratedScriptDto parse(String text, String model) {
        try {
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start < 0 || end <= start) throw invalid();
            JsonNode root = mapper.readTree(text.substring(start, end + 1));
            for (String field : TEXT_FIELDS) {
                if (!root.path(field).isTextual() || root.path(field).asText().isBlank()) throw invalid();
            }
            JsonNode durationNode = root.path("estimatedDurationSeconds");
            if (!durationNode.isIntegralNumber() || !durationNode.canConvertToInt()) throw invalid();
            int duration = durationNode.intValue();
            if (duration <= 0 || duration > 600 || root.path("title").asText().length() > 255
                    || root.path("targetAudience").asText().length() > 300) throw invalid();
            List<String> hashtags = new ArrayList<>();
            if (!root.path("suggestedHashtags").isArray()) throw invalid();
            for (JsonNode tag : root.path("suggestedHashtags")) {
                if (!tag.isTextual()) throw invalid();
                if (!tag.asText().isBlank()) hashtags.add(tag.asText());
            }
            return new GeneratedScriptDto(root.path("title").asText(), root.path("targetAudience").asText(),
                    root.path("hook3s").asText(), root.path("bodyContent").asText(), root.path("callToAction").asText(),
                    root.path("visualAndSoundCues").asText(), hashtags, duration, model);
        } catch (UpstreamServiceException ex) { throw ex; }
        catch (Exception ex) { throw invalid(); }
    }

    private UpstreamServiceException invalid() {
        return new UpstreamServiceException("AI trả về kịch bản chưa đầy đủ. Vui lòng thử lại; kết quả lỗi chưa được lưu.");
    }
}
