package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.config.WorkspaceIdentity;
import com.tiktok.intelligence.dto.request.JobFilterRequest;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.dto.response.JobResponseDto;
import com.tiktok.intelligence.service.queue.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Analysis Jobs", description = "Asynchronous analysis jobs and AWS SQS queue coordination")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @Operation(summary = "Dispatch asynchronous analysis job", description = "Submits a background job to AWS SQS queue and deducts user credits. Returns HTTP 202 Accepted.")
    public ResponseEntity<ApiResponse<JobResponseDto>> dispatchJob(
            @Valid @RequestBody JobFilterRequest request
    ) {
        JobResponseDto response = jobService.createAndDispatchJob(WorkspaceIdentity.OWNER_EMAIL, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(response, "Analysis job dispatched to queue"));
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Get analysis job status and progress", description = "Fetches job status, processing duration, and error logs if failed")
    public ResponseEntity<ApiResponse<JobResponseDto>> getJob(
            @PathVariable UUID jobId
    ) {
        JobResponseDto response = jobService.getJobById(jobId, WorkspaceIdentity.OWNER_EMAIL);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-jobs")
    @Operation(summary = "List workspace jobs", description = "Returns the shared tool's dispatched analysis jobs; no account or token required")
    public ResponseEntity<ApiResponse<List<JobResponseDto>>> getMyJobs() {
        List<JobResponseDto> jobs = jobService.getUserJobs(WorkspaceIdentity.OWNER_EMAIL);
        return ResponseEntity.ok(ApiResponse.success(jobs, "Fetched user jobs successfully"));
    }
}
