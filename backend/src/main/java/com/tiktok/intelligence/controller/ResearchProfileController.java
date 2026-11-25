package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.domain.entity.ResearchProfile;
import com.tiktok.intelligence.dto.request.ResearchProfileRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.ResearchProfileRepository;
import com.tiktok.intelligence.service.research.ChannelInsightsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Locale;

@RestController @RequestMapping("/api/v1/research-profiles") @RequiredArgsConstructor
public class ResearchProfileController {
    private final ResearchProfileRepository profiles;

    @GetMapping
    public ApiResponse<List<ResearchProfile>> list() {
        return ApiResponse.success(profiles.findAllByOrderByUpdatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResearchProfile>> create(@Valid @RequestBody ResearchProfileRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.success(save(new ResearchProfile(), request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ResearchProfile> update(@PathVariable Long id, @Valid @RequestBody ResearchProfileRequest request) {
        return ApiResponse.success(save(find(id), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        profiles.delete(find(id));
        return ApiResponse.success(null, "Đã xóa hồ sơ.");
    }

    private ResearchProfile find(Long id) {
        return profiles.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng."));
    }

    private ResearchProfile save(ResearchProfile profile, ResearchProfileRequest input) {
        ChannelInsightsService.validateTerms(input.keywords(), true);
        ChannelInsightsService.validateTerms(input.excludedKeywords(), false);
        profile.setName(input.name().strip());
        profile.setOwnUsername(clean(input.ownUsername()).replace("@", "").toLowerCase(Locale.ROOT));
        profile.setTargetAudience(input.targetAudience().strip());
        profile.setOffering(clean(input.offering()));
        profile.setGoal(clean(input.goal()));
        profile.setKeywords(input.keywords().strip());
        profile.setExcludedKeywords(clean(input.excludedKeywords()));
        profile.setAnalyticsNotes(clean(input.analyticsNotes()));
        return profiles.saveAndFlush(profile);
    }

    private String clean(String value) { return value == null ? "" : value.strip(); }
}
