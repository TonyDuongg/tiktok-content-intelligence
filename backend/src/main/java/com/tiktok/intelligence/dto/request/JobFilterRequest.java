package com.tiktok.intelligence.dto.request;

import com.tiktok.intelligence.domain.enums.JobType;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record JobFilterRequest(
        @NotNull(message = "Loại tác vụ không được để trống")
        JobType jobType,

        Long categoryId,
        String nicheKeyword,
        List<String> targetChannels,
        Long minViews,
        Integer dateRangeDays,
        String tone,
        String targetAudience,
        Map<String, Object> customParams
) {
    public Map<String, Object> toFilterMap() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        if (categoryId != null) map.put("categoryId", categoryId);
        if (nicheKeyword != null) map.put("nicheKeyword", nicheKeyword);
        if (targetChannels != null) map.put("targetChannels", targetChannels);
        if (minViews != null) map.put("minViews", minViews);
        if (dateRangeDays != null) map.put("dateRangeDays", dateRangeDays);
        if (tone != null) map.put("tone", tone);
        if (targetAudience != null) map.put("targetAudience", targetAudience);
        if (customParams != null) map.putAll(customParams);
        return map;
    }
}
