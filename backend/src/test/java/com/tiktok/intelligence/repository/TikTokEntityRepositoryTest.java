package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.*;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.domain.enums.JobType;
import com.tiktok.intelligence.domain.enums.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TikTokEntityRepositoryTest {

    @Autowired
    private org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TikTokChannelRepository channelRepository;

    @Autowired
    private TikTokVideoRepository videoRepository;

    @Autowired
    private AnalysisJobRepository jobRepository;

    @Autowired
    private AiScriptRepository scriptRepository;

    @Test
    @DisplayName("Test User persistence and query")
    void testUserPersistence() {
        User user = User.builder()
                .email("creator@example.com")
                .passwordHash("hashed_pwd")
                .fullName("Nguyen Van A")
                .role(UserRole.ROLE_USER)
                .creditsBalance(50)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        assertThat(savedUser.getId()).isNotNull();

        Optional<User> found = userRepository.findByEmail("creator@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Nguyen Van A");
        assertThat(found.get().getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Test Category and TikTok Channel persistence")
    void testCategoryAndChannel() {
        Category category = Category.builder()
                .name("Mỹ phẩm & Skincare")
                .slug("my-pham-skincare")
                .description("Ngành hàng làm đẹp")
                .build();
        category = categoryRepository.save(category);

        TikTokChannel channel = TikTokChannel.builder()
                .category(category)
                .tiktokUsername("beautytips_vn")
                .nickname("Beauty Tips Vietnam")
                .followersCount(250000L)
                .totalLikes(3500000L)
                .build();
        channel = channelRepository.save(channel);

        assertThat(channel.getId()).isNotNull();
        assertThat(channel.getCategory().getSlug()).isEqualTo("my-pham-skincare");

        List<TikTokChannel> channelsInNiche = channelRepository.findByCategoryId(category.getId());
        assertThat(channelsInNiche).hasSize(1);
    }

    @Test
    @DisplayName("Test TikTok Video engagement rate calculation and query")
    void testTikTokVideoEngagementRate() {
        Category category = categoryRepository.save(Category.builder()
                .name("Thời trang")
                .slug("thoi-trang")
                .build());

        TikTokChannel channel = channelRepository.save(TikTokChannel.builder()
                .category(category)
                .tiktokUsername("fashion_daily")
                .build());

        TikTokVideo video = TikTokVideo.builder()
                .channel(channel)
                .tiktokVideoId("v_123456789")
                .videoUrl("https://tiktok.com/@fashion_daily/video/123456789")
                .caption("Top 5 cách phối đồ mùa đông #fashion #style")
                .hashtags(List.of("#fashion", "#style"))
                .viewCount(100000L)
                .likeCount(8000L)
                .commentCount(500L)
                .shareCount(1500L)
                .videoPublishedAt(Instant.now())
                .build();

        video.calculateEngagementRate();
        videoRepository.save(video);

        // (8000 + 500 + 1500) / 100000 * 100 = 10.000%
        assertThat(video.getEngagementRate()).isEqualByComparingTo(new BigDecimal("10.000"));

        entityManager.flush();
        entityManager.clear();

        List<TikTokVideo> topVideos = videoRepository.findByChannelIdOrderByEngagementRateDesc(
                channel.getId(), PageRequest.of(0, 5));
        assertThat(topVideos).hasSize(1);
        assertThat(topVideos.get(0).getTiktokVideoId()).isEqualTo("v_123456789");
        assertThat(topVideos.get(0).getHashtags()).containsExactly("#fashion", "#style");
    }

    @Test
    @DisplayName("Test Analysis Job and AI Script persistence with JSON filter params")
    void testAnalysisJobAndAiScript() {
        User user = userRepository.save(User.builder()
                .email("user2@example.com")
                .passwordHash("pwd")
                .fullName("User Two")
                .build());

        AnalysisJob job = AnalysisJob.builder()
                .user(user)
                .jobType(JobType.ANALYZE_AND_GENERATE_SCRIPT)
                .status(JobStatus.PENDING)
                .filterParams(Map.of("niche", "makeup", "min_views", 50000))
                .build();
        job = jobRepository.save(job);

        assertThat(job.getId()).isNotNull();
        assertThat(job.getFilterParams()).containsEntry("niche", "makeup");

        AiScript script = AiScript.builder()
                .job(job)
                .user(user)
                .title("Bí quyết thoa son không bị khô môi")
                .targetAudience("x".repeat(300))
                .hook3s("Đừng thoa son trực tiếp nếu bạn không muốn môi bong vảy!")
                .bodyContent("Dùng son dưỡng lót trước 5 phút rồi lau nhẹ...")
                .callToAction("Follow kênh để nhận thêm mẹo làm đẹp!")
                .suggestedHashtags(List.of("#sonmoi", "#lipstick", "#beautytips"))
                .requestedDurationSeconds(120)
                .build();
        script = scriptRepository.save(script);

        assertThat(script.getId()).isNotNull();
        assertThat(script.getSuggestedHashtags()).contains("#sonmoi");

        entityManager.flush();
        entityManager.clear();

        List<AiScript> userScripts = scriptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertThat(userScripts).hasSize(1);
        assertThat(userScripts.getFirst().getSuggestedHashtags()).containsExactly("#sonmoi", "#lipstick", "#beautytips");
        assertThat(userScripts.getFirst().getRequestedDurationSeconds()).isEqualTo(120);
        assertThat(userScripts.getFirst().getTargetAudience()).hasSize(300);
    }
}
