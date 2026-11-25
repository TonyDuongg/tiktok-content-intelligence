package com.tiktok.intelligence.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.util.List;

public record DirectGenerateScriptRequest(
        @Positive Long categoryId,

        @NotBlank(message = "Video topic is required")
        @Size(max = 1000, message = "Topic must not exceed 1000 characters")
        String topic,

        @Size(max = 300, message = "Target audience must not exceed 300 characters")
        String targetAudience,
        @Size(max = 100, message = "Tone must not exceed 100 characters")
        String tone,
        @Size(max = 5, message = "Select up to 5 reference videos")
        List<@Positive Long> referenceVideoIds,
        @Min(value = 15, message = "Duration must be at least 15 seconds")
        @Max(value = 600, message = "Duration must not exceed 10 minutes")
        Integer requestedDurationSeconds
) {
    public int durationSeconds() {
        return requestedDurationSeconds == null ? 60 : requestedDurationSeconds;
    }
}
