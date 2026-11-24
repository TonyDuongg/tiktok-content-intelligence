package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workspace")
public class WorkspaceController {
    @Value("${application.ai.provider:gemini}") private String aiProvider;
    @Value("${application.ai.gemini-api-key:}") private String geminiKey;
    @Value("${application.ai.gemini-model:gemini-3.5-flash}") private String model;
    @Value("${application.scraper.provider:rapidapi}") private String scraperProvider;
    @Value("${application.scraper.rapidapi-key:}") private String scraperKey;

    public record WorkspaceStatus(boolean liveMode, boolean aiConfigured, boolean scraperConfigured,
                                  String aiProvider, String aiModel, String scraperProvider, List<String> issues) {}

    @GetMapping("/status")
    public ApiResponse<WorkspaceStatus> status() {
        boolean aiConfigured = "bedrock".equalsIgnoreCase(aiProvider)
                || (("gemini".equalsIgnoreCase(aiProvider) || "google".equalsIgnoreCase(aiProvider)) && !geminiKey.isBlank());
        boolean scraperConfigured = "rapidapi".equalsIgnoreCase(scraperProvider) && !scraperKey.isBlank();
        List<String> issues = new ArrayList<>();
        if (!aiConfigured) issues.add("Chưa cấu hình AI thật. Kiểm tra AI_PROVIDER và GEMINI_API_KEY trong .env.");
        if (!scraperConfigured) issues.add("Chưa cấu hình nguồn TikTok. Kiểm tra SCRAPER_PROVIDER=rapidapi và RAPIDAPI_KEY trong .env.");
        return ApiResponse.success(new WorkspaceStatus(true, aiConfigured, scraperConfigured,
                aiProvider, "bedrock".equalsIgnoreCase(aiProvider) ? "AWS Bedrock" : model, scraperProvider, issues));
    }
}
