package com.tiktok.intelligence.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DirectGenerateScriptRequest(
        Long categoryId,

        @NotBlank(message = "Chủ đề video không được để trống")
        String topic,

        String targetAudience,
        String tone,
        List<Long> referenceVideoIds
) {
}
