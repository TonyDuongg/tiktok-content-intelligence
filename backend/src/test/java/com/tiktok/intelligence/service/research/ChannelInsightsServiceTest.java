package com.tiktok.intelligence.service.research;

import com.tiktok.intelligence.domain.entity.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class ChannelInsightsServiceTest {
    private final ChannelInsightsService service = new ChannelInsightsService(null, null, null, null);
    private final Instant now = Instant.parse("2026-11-25T00:00:00Z");

    private ResearchProfile profile(String terms) {
        ResearchProfile p = new ResearchProfile(); p.setId(1L); p.setName("Chăm sóc da");
        p.setTargetAudience("Sinh viên cần chăm sóc da"); p.setKeywords(terms); p.setExcludedKeywords("thuốc lá"); return p;
    }
    private TikTokVideo video(long id, String caption, long views, String... tags) {
        return TikTokVideo.builder().id(id).caption(caption).viewCount(views).durationSeconds(30)
                .hashtags(List.of(tags)).videoUrl("https://www.tiktok.com/@creator/video/" + id).build();
    }
    private ChannelInsightsService.Report analyze(ResearchProfile p, List<TikTokVideo> videos, List<VideoObservation> points) {
        return service.analyze(TikTokChannel.builder().tiktokUsername("creator").lastScrapedAt(now).build(), p, videos, points, now);
    }

    @Test void matchesVietnamesePhrasesAndWholeWordsRatherThanDemographicClaims() {
        var result = analyze(profile("kem chống nắng, da"), List.of(video(1, "KEM CHONG NANG cho bạn", 100),
                video(2, "Đam mê học tập", 900), video(3, "Nấu ăn", 500), video(4, "", 1000)), List.of());
        assertThat(result.sampleCount()).isEqualTo(4);
        assertThat(result.describedCount()).isEqualTo(3);
        assertThat(result.matchingCount()).isEqualTo(1);
        assertThat(result.contentMatchPercent()).isEqualTo(33);
        assertThat(result.matchedKeywords()).containsExactly("kem chống nắng");
        assertThat(result.unmatchedKeywords()).containsExactly("da");
        assertThat(result.limitations()).anyMatch(s -> s.contains("does not measure actual audience overlap"));
    }

    @Test void withholdsScoreForTinySampleAndDoesNotRecommendExcludedOrUnmatchedContent() {
        var result = analyze(profile("da dầu"), List.of(video(1, "Da dầu và thuốc lá", 500), video(2, "Thời trang", 1000)), List.of());
        assertThat(result.contentMatchPercent()).isNull();
        assertThat(result.excludedVideoCount()).isEqualTo(1);
        assertThat(result.experiments()).isEmpty();
        assertThat(result.growth()).isEmpty();
    }

    @Test void deduplicatesTopicsPerVideoIgnoresGenericTagsAndUsesMedian() {
        var result = analyze(profile("da dầu"), List.of(video(1, "Da dầu", 10, "skincare", "#skincare", "fyp"),
                video(2, "Da dầu", 100, "skincare", "viral"), video(3, "Da dầu", 1000000, "fyp")), List.of());
        assertThat(result.topics()).hasSize(1);
        assertThat(result.topics().getFirst().videoCount()).isEqualTo(2);
        assertThat(result.topics().getFirst().medianViews()).isEqualTo(55);
        assertThat(result.durations().getFirst().medianViews()).isEqualTo(100);
        assertThat(result.experiments()).hasSize(1);
    }

    @Test void measuresOnlyObservedGrowthAcrossAtLeastOneHourAndRejectsCounterResets() {
        TikTokVideo first = video(1, "Da dầu", 4000), reset = video(2, "Da dầu", 1), shortWindow = video(3, "Da dầu", 200);
        var points = List.of(point(first, -7200, 1000), point(first, -3600, 2000), point(first, 0, 4000),
                point(reset, -7200, 100), point(reset, 0, 1),
                point(shortWindow, -600, 100), point(shortWindow, 0, 200), point(first, 3600, 999999));
        var result = analyze(profile("da dầu"), List.of(first, reset, shortWindow), points);
        assertThat(result.growth()).hasSize(1);
        assertThat(result.growth().getFirst().addedViews()).isEqualTo(2000);
        assertThat(result.growth().getFirst().viewsPerHour()).isEqualTo(2000.0);
        assertThat(result.growth().getFirst().to()).isEqualTo(now);
    }

    @Test void validatesKeywordLimitsAndIgnoresDuplicateAccentVariants() {
        assertThat(ChannelInsightsService.terms("da dầu, DA DAU; #skincare")).containsExactly("da dầu", "skincare");
        assertThatThrownBy(() -> ChannelInsightsService.validateTerms("!!!", true)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatThrownBy(() -> ChannelInsightsService.validateTerms("a", true)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatCode(() -> ChannelInsightsService.validateTerms(null, false)).doesNotThrowAnyException();
    }

    @Test void prioritizesMeasuredGrowthOverLifetimeViewsWhenChoosingAnExperiment() {
        TikTokVideo oldPopular = video(1, "Da dầu", 1000000), increasing = video(2, "Da dầu", 5000);
        var result = analyze(profile("da dầu"), List.of(oldPopular, increasing),
                List.of(point(increasing, -7200, 1000), point(increasing, 0, 5000)));
        assertThat(result.experiments()).hasSize(1);
        assertThat(result.experiments().getFirst().reference().videoId()).isEqualTo(2L);
        assertThat(result.experiments().getFirst().rationale()).contains("views/hour");
    }

    private VideoObservation point(TikTokVideo v, long seconds, long views) {
        return VideoObservation.builder().video(v).observedAt(now.plusSeconds(seconds)).viewCount(views).build();
    }
}
