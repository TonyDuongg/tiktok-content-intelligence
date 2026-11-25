package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.service.ai.MultiProviderAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class WorkspaceController {
    private final MultiProviderAiService aiConnections;
    @Value("${application.ai.provider:gemini}") private String aiProvider;
    @Value("${application.ai.gemini-api-key:}") private String geminiKey;
    @Value("${application.ai.gemini-model:gemini-3.5-flash}") private String model;
    @Value("${application.scraper.provider:rapidapi}") private String scraperProvider;
    @Value("${application.scraper.rapidapi-key:}") private String scraperKey;

    public record WorkspaceStatus(boolean liveMode, boolean aiConfigured, boolean scraperConfigured,
                                  String aiProvider, String aiModel, String scraperProvider, List<String> issues) {}

    @GetMapping("/status")
    public ApiResponse<WorkspaceStatus> status() {
        var connection = aiConnections.providers().stream().filter(p -> p.id().equalsIgnoreCase(aiProvider)).findFirst();
        boolean aiConfigured = "bedrock".equalsIgnoreCase(aiProvider)
                || ("google".equalsIgnoreCase(aiProvider) && !geminiKey.isBlank())
                || connection.map(p -> p.configured() && !p.model().isBlank()).orElse(false);
        boolean scraperConfigured = "rapidapi".equalsIgnoreCase(scraperProvider) && !scraperKey.isBlank();
        List<String> issues = new ArrayList<>();
        if (!aiConfigured) issues.add("AI is not configured. Open AI settings to choose a provider, add your API key and select a model.");
        if (!scraperConfigured) issues.add("TikTok data is not configured. Check SCRAPER_PROVIDER=rapidapi and RAPIDAPI_KEY in the server environment, or add your key in desktop Settings.");
        return ApiResponse.success(new WorkspaceStatus(true, aiConfigured, scraperConfigured,
                aiProvider, "bedrock".equalsIgnoreCase(aiProvider) ? "AWS Bedrock" : connection.map(MultiProviderAiService.ProviderInfo::model).orElse(model), scraperProvider, issues));
    }
}
