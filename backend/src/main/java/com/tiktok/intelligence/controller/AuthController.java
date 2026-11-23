package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.dto.request.LoginRequest;
import com.tiktok.intelligence.dto.request.RegisterRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.dto.response.AuthResponse;
import com.tiktok.intelligence.dto.response.UserDto;
import com.tiktok.intelligence.service.auth.AuthService;
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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Đăng ký, đăng nhập và lấy thông tin tài khoản người dùng")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Tạo tài khoản người dùng mới và tự động cấp 50 credit ban đầu")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký tài khoản thành công"));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Xác thực email và mật khẩu, trả về JWT Access Token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Yêu cầu Bearer JWT Token trong Header Authorization")
    @SecurityRequirement(name = "BearerAuth")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserDto userDto = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(userDto, "Lấy thông tin tài khoản thành công"));
    }
}
