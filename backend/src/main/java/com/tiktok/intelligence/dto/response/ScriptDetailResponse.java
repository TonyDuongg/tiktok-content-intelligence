package com.tiktok.intelligence.dto.response;

import com.tiktok.intelligence.domain.entity.AiScript;
import com.tiktok.intelligence.domain.entity.ScriptReferenceVideo;
import com.tiktok.intelligence.domain.enums.ScriptStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ScriptDetailResponse(
        Long id,
        String title,
        String targetAudience,
        Integer estimatedDurationSeconds,
        ScriptStructure scriptStructure,
        String visualAndSoundCues,
        List<String> suggestedHashtags,
        String aiModelUsed,
        ScriptStatus status,
        List<ReferenceVideoDto> referenceVideos,
        Instant createdAt
) {
    public record ScriptStructure(
            String hook3s,
            String bodyContent,
            String callToAction
    ) {}

    public record ReferenceVideoDto(
            Long videoId,
            String tiktokVideoId,
            String videoUrl,
            Long viewCount,
            BigDecimal engagementRate,
            String insightNote
    ) {
        public static ReferenceVideoDto fromEntity(ScriptReferenceVideo ref) {
            return new ReferenceVideoDto(
                    ref.getVideo().getId(),
                    ref.getVideo().getTiktokVideoId(),
                    ref.getVideo().getVideoUrl(),
                    ref.getVideo().getViewCount(),
                    ref.getVideo().getEngagementRate(),
                    ref.getInsightNote()
            );
        }
    }

    public static ScriptDetailResponse fromEntity(AiScript script, List<ScriptReferenceVideo> references) {
        List<ReferenceVideoDto> refDtos = references != null
                ? references.stream().map(ReferenceVideoDto::fromEntity).toList()
                : List.of();

        return new ScriptDetailResponse(
                script.getId(),
                script.getTitle(),
                script.getTargetAudience(),
                script.getEstimatedDurationSeconds(),
                new ScriptStructure(script.getHook3s(), script.getBodyContent(), script.getCallToAction()),
                script.getVisualAndSoundCues(),
                script.getSuggestedHashtags(),
                script.getAiModelName(),
                script.getStatus(),
                refDtos,
                script.getCreatedAt()
        );
    }
}
