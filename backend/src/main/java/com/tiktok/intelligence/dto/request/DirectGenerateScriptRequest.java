package com.tiktok.intelligence.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.util.List;

public record DirectGenerateScriptRequest(
        @Positive Long categoryId,

        @NotBlank(message = "Chủ đề video không được để trống")
        @Size(max = 1000, message = "Chủ đề tối đa 1000 ký tự")
        String topic,

        @Size(max = 300, message = "Đối tượng tối đa 300 ký tự")
        String targetAudience,
        @Size(max = 100, message = "Giọng điệu tối đa 100 ký tự")
        String tone,
        @Size(max = 5, message = "Chọn tối đa 5 video tham khảo")
        List<@Positive Long> referenceVideoIds,
        @Min(value = 15, message = "Thời lượng tối thiểu 15 giây")
        @Max(value = 600, message = "Thời lượng tối đa 10 phút")
        Integer requestedDurationSeconds
) {
    public int durationSeconds() {
        return requestedDurationSeconds == null ? 60 : requestedDurationSeconds;
    }
}
