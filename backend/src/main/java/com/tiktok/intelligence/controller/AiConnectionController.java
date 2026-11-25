package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.service.ai.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiConnectionController {
    private final MultiProviderAiService ai;
    @GetMapping("/providers")
    public ApiResponse<List<MultiProviderAiService.ProviderInfo>> providers() { return ApiResponse.success(ai.providers()); }
    @PostMapping("/models")
    public ResponseEntity<ApiResponse<List<MultiProviderAiService.ModelOption>>> models(
            @RequestHeader("X-AI-Provider") String provider,
            @RequestHeader(value = "X-AI-Key", required = false) String key) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(ai.models(new AiSelection(provider, null, key))));
    }
}
