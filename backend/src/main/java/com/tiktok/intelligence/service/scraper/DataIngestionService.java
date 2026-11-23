package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.domain.entity.Category;
import com.tiktok.intelligence.domain.entity.TikTokChannel;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import com.tiktok.intelligence.dto.scraper.TikTokChannelProfileDto;
import com.tiktok.intelligence.dto.scraper.TikTokVideoDto;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.CategoryRepository;
import com.tiktok.intelligence.repository.TikTokChannelRepository;
import com.tiktok.intelligence.repository.TikTokVideoRepository;
import com.tiktok.intelligence.service.storage.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataIngestionService {

    private final TikTokScraperFactory scraperFactory;
    private final TikTokChannelRepository channelRepository;
    private final TikTokVideoRepository videoRepository;
    private final CategoryRepository categoryRepository;
    private final S3StorageService s3StorageService;

    @Transactional
    public TikTokChannel ingestChannelData(String rawUsername, Long categoryId, int maxVideos) {
        String username = rawUsername.replace("@", "").trim().toLowerCase();
        log.info("Starting ingestion pipeline for channel: @{}, categoryId: {}", username, categoryId);

        // 1. Scrape via active strategy (Mock or RapidAPI)
        TikTokScraperClient client = scraperFactory.getScraperClient();
        ScrapeResultDto scrapeResult = client.scrapeChannel(username, maxVideos);

        // 2. Resolve Category
        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + categoryId));
        }

        // 3. Save or Update TikTokChannel
        TikTokChannelProfileDto profile = scrapeResult.channel();
        TikTokChannel channel = channelRepository.findByTiktokUsername(username)
                .orElseGet(() -> TikTokChannel.builder()
                        .tiktokUsername(username)
                        .build());

        channel.setNickname(profile.nickname());
        channel.setAvatarUrl(profile.avatarUrl());
        channel.setBio(profile.bio());
        channel.setFollowersCount(profile.followersCount());
        channel.setTotalLikes(profile.totalLikes());
        channel.setTotalVideos(profile.totalVideos());
        channel.setLastScrapedAt(Instant.now());
        if (category != null) {
            channel.setCategory(category);
        }
        channel = channelRepository.save(channel);

        // 4. Save or Update Videos
        List<TikTokVideo> savedVideos = new ArrayList<>();
        for (TikTokVideoDto videoDto : scrapeResult.videos()) {
            final TikTokChannel finalChannel = channel;
            TikTokVideo video = videoRepository.findByTiktokVideoId(videoDto.videoId())
                    .orElseGet(() -> TikTokVideo.builder()
                            .channel(finalChannel)
                            .tiktokVideoId(videoDto.videoId())
                            .build());

            video.setVideoUrl(videoDto.videoUrl());
            video.setCoverImageUrl(videoDto.coverImageUrl());
            video.setCaption(videoDto.caption());
            video.setHashtags(videoDto.hashtags());
            video.setViewCount(videoDto.viewCount());
            video.setLikeCount(videoDto.likeCount());
            video.setCommentCount(videoDto.commentCount());
            video.setShareCount(videoDto.shareCount());
            video.setDurationSeconds(videoDto.durationSeconds());
            video.setSoundTitle(videoDto.soundTitle());
            video.setTranscript(videoDto.transcript());
            video.setVideoPublishedAt(videoDto.publishedAt());
            video.calculateEngagementRate();

            savedVideos.add(videoRepository.save(video));
        }

        log.info("Successfully persisted {} videos for channel: @{}", savedVideos.size(), username);

        // 5. Upload Raw Scraping JSON to AWS S3 for audit and AI replay
        try {
            String s3Key = String.format("channels/%s/%d.json", username, System.currentTimeMillis());
            String s3Url = s3StorageService.uploadJsonPayload(s3Key, scrapeResult);
            log.info("Archived raw TikTok scrape data to AWS S3: {}", s3Url);
        } catch (Exception e) {
            log.warn("S3 archiving warning (Local dev non-fatal): {}", e.getMessage());
        }

        return channel;
    }
}
