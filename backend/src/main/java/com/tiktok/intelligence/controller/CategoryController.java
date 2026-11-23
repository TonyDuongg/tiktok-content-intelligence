package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.domain.entity.Category;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Categories & Niches", description = "Quản lý và lấy danh sách ngành hàng (Mỹ phẩm, Thời trang, v.v.)")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách các ngành hàng", description = "Trả về toàn bộ các ngành hàng hỗ trợ phân tích xu hướng TikTok")
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh sách ngành hàng thành công"));
    }
}
