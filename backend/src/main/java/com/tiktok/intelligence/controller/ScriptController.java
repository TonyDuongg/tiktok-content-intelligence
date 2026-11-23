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
@Tag(name = "AI Scripts", description = "Quản lý và sinh kịch bản video TikTok viral bằng AI")
public class ScriptController {

    private final AiScriptService aiScriptService;

    private String resolveUsername(UserDetails userDetails) {
        return (userDetails != null && userDetails.getUsername() != null) ? userDetails.getUsername() : "creator@example.com";
    }

    @PostMapping("/generate")
    @Operation(summary = "Sinh kịch bản trực tiếp bằng AI", description = "Sinh kịch bản video TikTok 3 phần (Hook, Body, CTA) theo chủ đề hoặc dựa trên các video mẫu")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> generateDirectScript(
            @Valid @RequestBody DirectGenerateScriptRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.generateDirectScript(resolveUsername(userDetails), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sinh kịch bản video AI thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết kịch bản video", description = "Bao gồm cấu trúc kịch bản 3 phần, gợi ý góc máy quay và danh sách video mẫu tham khảo")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> getScriptDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.getScriptDetail(id, resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-scripts")
    @Operation(summary = "Lấy danh sách các kịch bản của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<ScriptDetailResponse>>> getMyScripts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ScriptDetailResponse> scripts = aiScriptService.getUserScripts(resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(scripts, "Lấy danh sách kịch bản thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái kịch bản", description = "Đổi trạng thái giữa DRAFT, FAVORITE, ARCHIVED")
    public ResponseEntity<ApiResponse<ScriptDetailResponse>> updateScriptStatus(
            @PathVariable Long id,
            @RequestParam ScriptStatus status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ScriptDetailResponse response = aiScriptService.updateScriptStatus(id, status, resolveUsername(userDetails));
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái kịch bản thành công"));
    }
}
