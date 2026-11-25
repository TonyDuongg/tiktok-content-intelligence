package com.tiktok.intelligence.dto.request;

import jakarta.validation.constraints.*;

public record ResearchProfileRequest(
        @NotBlank @Size(max = 100) String name,
        @Pattern(regexp = "(?:@?[A-Za-z0-9._]{2,24})?", message = "Invalid TikTok username") String ownUsername,
        @NotBlank @Size(max = 300) String targetAudience,
        @Size(max = 500) String offering,
        @Size(max = 500) String goal,
        @NotBlank @Size(max = 1000) String keywords,
        @Size(max = 1000) String excludedKeywords,
        @Size(max = 2000) String analyticsNotes
) {}
