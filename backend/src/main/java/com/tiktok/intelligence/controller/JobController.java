package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.dto.request.JobFilterRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.dto.response.JobResponseDto;
import com.tiktok.intelligence.service.queue.JobService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Analysis Jobs", description = "Quản lý và điều phối các tác vụ phân tích cào dữ liệu bất đồng bộ qua AWS SQS")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @Operation(summary = "Khởi tạo tác vụ phân tích bất đồng bộ", description = "Đưa tác vụ vào hàng đợi AWS SQS và trừ 5 credit người dùng. Trả về mã jobId ngay lập tức.")
    public ResponseEntity<ApiResponse<JobResponseDto>> dispatchJob(
            @Valid @RequestBody JobFilterRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        JobResponseDto response = jobService.createAndDispatchJob(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(response, "Tác vụ đã được tiếp nhận và đưa vào hàng đợi xử lý"));
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Kiểm tra tiến trình và trạng thái tác vụ")
    public ResponseEntity<ApiResponse<JobResponseDto>> getJob(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        JobResponseDto response = jobService.getJobById(jobId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-jobs")
    @Operation(summary = "Lấy danh sách các tác vụ của tài khoản hiện tại")
    public ResponseEntity<ApiResponse<List<JobResponseDto>>> getMyJobs(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<JobResponseDto> jobs = jobService.getUserJobs(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(jobs, "Lấy danh sách tác vụ thành công"));
    }
}
