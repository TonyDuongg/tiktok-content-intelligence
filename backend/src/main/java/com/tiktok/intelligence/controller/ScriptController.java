package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.domain.enums.ScriptStatus;
import com.tiktok.intelligence.dto.request.DirectGenerateScriptRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.dto.response.ScriptDetailResponse;
import com.tiktok.intelligence.service.ai.AiScriptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scripts")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "AI Scripts", description = "Generative AI TikTok video script generator and script library management")
public class ScriptController {

    private final AiScriptService aiScriptService;

    private String resolveUsername(UserDetails userDetails) {
        return (userDetails != null && userDetails.getUsername() != null) ? userDetails.getUsername() : "creator@example.com";
    }

    @PostMapping("/generate")
    @Operation(summary = "Direct AI script generation", description = "Generates a high-converting 3-part TikTok video script (Hook 3s, Body with visual cues, CTA) by topic or viral reference videos")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> generateDirectScript(
            @Valid @RequestBody DirectGenerateScriptRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.generateDirectScript(resolveUsername(userDetails), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Generated AI script successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get video script details", description = "Fetches complete script structure, visual/sound cues, hashtags, and reference viral videos")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> getScriptDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.getScriptDetail(id, resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-scripts")
    @Operation(summary = "List all scripts for current user", description = "Returns user's saved and generated script library")
    public ResponseEntity<ApiResponse<List<ScriptDetailResponse>>> getMyScripts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ScriptDetailResponse> scripts = aiScriptService.getUserScripts(resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(scripts, "Fetched scripts successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update script status", description = "Toggles status between DRAFT, FAVORITE, ARCHIVED")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> updateScriptStatus(
            @PathVariable Long id,
            @RequestParam ScriptStatus status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.updateScriptStatus(id, status, resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(response, "Updated script status successfully"));
    }
}
