package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.domain.enums.ScriptStatus;
import com.tiktok.intelligence.config.WorkspaceIdentity;
import com.tiktok.intelligence.dto.request.DirectGenerateScriptRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.dto.response.ScriptDetailResponse;
import com.tiktok.intelligence.service.ai.AiScriptService;
import com.tiktok.intelligence.service.ai.AiSelection;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scripts")
@RequiredArgsConstructor
@Tag(name = "AI Scripts", description = "Generative AI TikTok video script generator and script library management")
public class ScriptController {

    private final AiScriptService aiScriptService;

    @PostMapping("/generate")
    @Operation(summary = "Direct AI script generation", description = "Generates a high-converting 3-part TikTok video script (Hook 3s, Body with visual cues, CTA) by topic or viral reference videos")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> generateDirectScript(
            @Valid @RequestBody DirectGenerateScriptRequest request,
            @RequestHeader(value = "X-AI-Provider", required = false) String provider,
            @RequestHeader(value = "X-AI-Model", required = false) String model,
            @RequestHeader(value = "X-AI-Key", required = false) String key
    ) {
        if (provider == null && (model != null || key != null)) throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Choose an AI provider when supplying a model or API key.");
        ScriptDetailResponse response = provider == null
                ? aiScriptService.generateDirectScript(WorkspaceIdentity.OWNER_EMAIL, request)
                : aiScriptService.generateDirectScript(WorkspaceIdentity.OWNER_EMAIL, request, new AiSelection(provider, model, key));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Generated AI script successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get video script details", description = "Fetches complete script structure, visual/sound cues, hashtags, and reference viral videos")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> getScriptDetail(
            @PathVariable Long id
    ) {
        ScriptDetailResponse response = aiScriptService.getScriptDetail(id, WorkspaceIdentity.OWNER_EMAIL);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-scripts")
    @Operation(summary = "List workspace scripts", description = "Returns the shared tool's saved and generated script library; no account or token required")
    public ResponseEntity<ApiResponse<List<ScriptDetailResponse>>> getMyScripts() {
        List<ScriptDetailResponse> scripts = aiScriptService.getUserScripts(WorkspaceIdentity.OWNER_EMAIL);
        return ResponseEntity.ok(ApiResponse.success(scripts, "Fetched scripts successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update script status", description = "Toggles status between DRAFT, FAVORITE, ARCHIVED")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> updateScriptStatus(
            @PathVariable Long id,
            @RequestParam ScriptStatus status
    ) {
        ScriptDetailResponse response = aiScriptService.updateScriptStatus(id, status, WorkspaceIdentity.OWNER_EMAIL);
        return ResponseEntity.ok(ApiResponse.success(response, "Updated script status successfully"));
    }
}
