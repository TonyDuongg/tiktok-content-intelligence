package com.tiktok.intelligence.controller;

import com.tiktok.intelligence.domain.entity.TikTokChannel;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.response.ApiResponse;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.TikTokChannelRepository;
import com.tiktok.intelligence.repository.TikTokVideoRepository;
import com.tiktok.intelligence.service.scraper.DataIngestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Validated
@Tag(name = "Channels & Videos", description = "TikTok competitor channels, video ingestion, and engagement metrics")
public class ChannelController {

    private final DataIngestionService dataIngestionService;
    private final TikTokChannelRepository channelRepository;
    private final TikTokVideoRepository videoRepository;

    @PostMapping("/ingest")
    @Operation(summary = "Ingest TikTok channel data", description = "Scrapes channel profile, videos, calculates engagement rates, and uploads raw JSON to AWS S3")
    public ResponseEntity<ApiResponse<TikTokChannel>> ingestChannel(
            @RequestParam @Pattern(regexp = "@?[A-Za-z0-9._]{2,24}", message = "Tên kênh gồm 2–24 chữ cái, số, dấu chấm hoặc gạch dưới") String username,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int maxVideos
    ) {
        TikTokChannel channel = dataIngestionService.ingestChannelData(username, categoryId, maxVideos);
        return ResponseEntity.ok(ApiResponse.success(channel, "Channel ingested successfully"));
    }

    @GetMapping("/{username}")
    @Operation(summary = "Get TikTok channel profile", description = "Fetches channel statistics including followers, total likes, and average engagement rate")
    public ResponseEntity<ApiResponse<TikTokChannel>> getChannel(@PathVariable String username) {
        String cleanUsername = username.replace("@", "").trim().toLowerCase();
        TikTokChannel channel = channelRepository.findByTiktokUsername(cleanUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found: @" + cleanUsername));
        return ResponseEntity.ok(ApiResponse.success(channel));
    }

    @GetMapping("/{username}/top-videos")
    @Operation(summary = "Get top viral videos for channel", description = "Returns top performing videos sorted by engagement rate descending")
    public ResponseEntity<ApiResponse<List<TikTokVideo>>> getTopVideos(
            @PathVariable String username,
            @RequestParam(defaultValue = "5") @Min(1) @Max(50) int limit
    ) {
        String cleanUsername = username.replace("@", "").trim().toLowerCase();
        TikTokChannel channel = channelRepository.findByTiktokUsername(cleanUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found: @" + cleanUsername));

        List<TikTokVideo> topVideos = videoRepository.findByChannelIdOrderByEngagementRateDesc(
                channel.getId(), PageRequest.of(0, limit)
        );
        return ResponseEntity.ok(ApiResponse.success(topVideos, "Fetched top viral videos successfully"));
    }
}
