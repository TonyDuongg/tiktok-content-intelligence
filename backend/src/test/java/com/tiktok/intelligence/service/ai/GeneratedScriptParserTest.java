package com.tiktok.intelligence.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.exception.UpstreamServiceException;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class GeneratedScriptParserTest {
    private final GeneratedScriptParser parser = new GeneratedScriptParser(new ObjectMapper());

    @Test
    void rejectsMissingContentInsteadOfInventingDefaults() {
        for (String body : new String[]{"not json", "{}", "{\"title\":\"Only title\"}"}) {
            assertThatThrownBy(() -> parser.parse(body, "gemini"))
                    .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("chưa đầy đủ");
        }
    }

    @Test
    void rejectsCoercedDurationsAndAudienceThatCannotBeStored() throws Exception {
        for (Object duration : List.of(35.5, "35", true, 4294967331L)) {
            assertThatThrownBy(() -> parser.parse(validPayload(duration, "Người xem"), "gemini"))
                    .isInstanceOf(UpstreamServiceException.class);
        }
        assertThatThrownBy(() -> parser.parse(validPayload(35, "x".repeat(301)), "gemini"))
                .isInstanceOf(UpstreamServiceException.class);
        assertThat(parser.parse(validPayload(35, "x".repeat(300)), "gemini").targetAudience()).hasSize(300);
    }

    private String validPayload(Object duration, String audience) throws Exception {
        return new ObjectMapper().writeValueAsString(Map.of("title", "Tiêu đề", "targetAudience", audience,
                "hook3s", "Hook", "bodyContent", "Body", "callToAction", "CTA", "visualAndSoundCues", "Quay",
                "suggestedHashtags", List.of("#video"), "estimatedDurationSeconds", duration));
    }
}
