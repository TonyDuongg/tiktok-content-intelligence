package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.domain.entity.Category;
import com.tiktok.intelligence.domain.entity.TikTokChannel;
import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import com.tiktok.intelligence.dto.scraper.TikTokChannelProfileDto;
import com.tiktok.intelligence.dto.scraper.TikTokVideoDto;
import com.tiktok.intelligence.repository.CategoryRepository;
import com.tiktok.intelligence.repository.TikTokChannelRepository;
import com.tiktok.intelligence.repository.TikTokVideoRepository;
import com.tiktok.intelligence.service.storage.S3StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataIngestionServiceTest {

    @Mock
    private TikTokScraperFactory scraperFactory;

    @Mock
    private TikTokScraperClient scraperClient;

    @Mock
    private TikTokChannelRepository channelRepository;

    @Mock
    private TikTokVideoRepository videoRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private S3StorageService s3StorageService;

    private DataIngestionService dataIngestionService;

    @BeforeEach
    void setUp() {
        dataIngestionService = new DataIngestionService(
                scraperFactory,
                channelRepository,
                videoRepository,
                categoryRepository,
                s3StorageService
        );
        org.springframework.test.util.ReflectionTestUtils.setField(dataIngestionService, "archiveEnabled", true);
    }

    @Test
    @DisplayName("Verify channel and video data ingestion pipeline")
    void testIngestChannelData() {
        TikTokChannelProfileDto profile = new TikTokChannelProfileDto(
                "skincare_guru", "Skincare Guru", "https://img.test/avatar.jpg",
                "Bio", 100000L, 500000L, 50
        );

        TikTokVideoDto videoDto = new TikTokVideoDto(
                "v_999", "https://tiktok.com/@skincare_guru/v_999", "https://img.test/v999.jpg",
                "Caption", List.of("#skincare"), 50000L, 4000L, 200L, 100L,
                30, "Sound", "Transcript", Instant.now()
        );

        ScrapeResultDto scrapeResult = ScrapeResultDto.of(profile, List.of(videoDto));

        when(scraperFactory.getScraperClient()).thenReturn(scraperClient);
        when(scraperClient.scrapeChannel("skincare_guru", 5)).thenReturn(scrapeResult);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(Category.builder().id(1L).name("Beauty").build()));
        when(channelRepository.findByTiktokUsername("skincare_guru")).thenReturn(Optional.empty());

        TikTokChannel savedChannel = TikTokChannel.builder()
                .id(10L)
                .tiktokUsername("skincare_guru")
                .nickname("Skincare Guru")
                .build();
        when(channelRepository.save(any(TikTokChannel.class))).thenReturn(savedChannel);

        when(videoRepository.findByTiktokVideoId("v_999")).thenReturn(Optional.empty());
        when(videoRepository.save(any(TikTokVideo.class))).thenAnswer(i -> i.getArgument(0));

        TikTokChannel result = dataIngestionService.ingestChannelData("@skincare_guru", 1L, 5);

        assertThat(result).isNotNull();
        assertThat(result.getTiktokUsername()).isEqualTo("skincare_guru");

        verify(channelRepository, times(1)).save(any(TikTokChannel.class));
        verify(videoRepository, times(1)).save(any(TikTokVideo.class));
        verify(s3StorageService, times(1)).uploadJsonPayload(anyString(), any(ScrapeResultDto.class));
    }

    @Test
    void missingCategoryDoesNotSpendScraperRequest() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> dataIngestionService.ingestChannelData("creator", 999L, 10))
                .isInstanceOf(com.tiktok.intelligence.exception.ResourceNotFoundException.class);
        verifyNoInteractions(scraperFactory, scraperClient, channelRepository, videoRepository, s3StorageService);
    }
}
