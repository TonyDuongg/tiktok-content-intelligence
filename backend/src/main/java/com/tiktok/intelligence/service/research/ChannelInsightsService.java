package com.tiktok.intelligence.service.research;

import com.tiktok.intelligence.domain.entity.*;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/** Descriptive public-data analysis. No demographic or viral-probability model is claimed. */
@Service @RequiredArgsConstructor
public class ChannelInsightsService {
    private final TikTokChannelRepository channels;
    private final TikTokVideoRepository videos;
    private final ResearchProfileRepository profiles;
    private final VideoObservationRepository observations;
    private static final Set<String> GENERIC_TAGS = Set.of("fyp", "foryou", "foryoupage", "viral", "xuhuong", "trending", "tiktok");

    public record Evidence(Long videoId, String caption, String videoUrl, long views, Integer durationSeconds,
                           List<String> matchedKeywords, List<String> excludedKeywords) {}
    public record Topic(String hashtag, int videoCount, long medianViews, List<Long> evidenceVideoIds) {}
    public record DurationGroup(String label, int videoCount, long medianViews) {}
    public record Growth(Long videoId, String caption, long addedViews, double hours, double viewsPerHour,
                         Instant from, Instant to) {}
    public record Experiment(String topic, String rationale, String measurement, int durationSeconds, Evidence reference) {}
    public record Report(String username, Long profileId, String profileName, String targetAudience,
                         String offering, String goal, Instant collectedAt, Instant analyzedAt,
                         int sampleCount, int describedCount, int matchingCount, Integer contentMatchPercent,
                         List<String> matchedKeywords, List<String> unmatchedKeywords, int excludedVideoCount,
                         List<Evidence> evidence, List<Topic> topics, List<DurationGroup> durations,
                         List<Growth> growth, List<Experiment> experiments, List<String> limitations) {}

    @Transactional(readOnly = true)
    public Report get(String username, Long profileId) {
        TikTokChannel channel = channels.findByTiktokUsername(username.replace("@", "").strip().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Channel not saved. Analyze the channel first."));
        ResearchProfile profile = profiles.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Audience profile not found."));
        List<TikTokVideo> sample = videos.findRecentForInsights(channel.getId(), PageRequest.of(0, 50));
        Instant now = Instant.now();
        List<VideoObservation> history = sample.isEmpty() ? List.of()
                : observations.findByVideoIdInAndObservedAtGreaterThanEqualOrderByObservedAtAsc(
                        sample.stream().map(TikTokVideo::getId).toList(), now.minus(Duration.ofDays(30)));
        return analyze(channel, profile, sample, history, now);
    }

    public static List<String> terms(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        Map<String, String> unique = new LinkedHashMap<>();
        for (String part : raw.split("[,;\\n]+")) {
            String term = part.strip().replaceFirst("^#", "");
            if (!normalize(term).isBlank()) unique.putIfAbsent(normalize(term), term);
        }
        return List.copyOf(unique.values());
    }

    public static void validateTerms(String raw, boolean required) {
        List<String> values = terms(raw);
        if ((required && values.isEmpty()) || values.size() > 15
                || values.stream().anyMatch(t -> normalize(t).length() < 2 || t.length() > 80)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Enter 1–15 comma-separated keywords, each 2–80 characters long.");
        }
    }

    static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ").strip().replaceAll("\\s+", " ");
    }

    private static String text(TikTokVideo video) {
        return String.join(" ", Objects.toString(video.getCaption(), ""), Objects.toString(video.getTranscript(), ""),
                String.join(" ", video.getHashtags() == null ? List.of() : video.getHashtags()));
    }

    private static List<String> matches(String text, List<String> terms) {
        String content = " " + normalize(text) + " ";
        return terms.stream().filter(term -> content.contains(" " + normalize(term) + " ")).toList();
    }

    public Report analyze(TikTokChannel channel, ResearchProfile profile, List<TikTokVideo> sample,
                          List<VideoObservation> history, Instant now) {
        List<String> keywords = terms(profile.getKeywords());
        List<String> excluded = terms(profile.getExcludedKeywords());
        List<TikTokVideo> described = sample.stream().filter(v -> !normalize(text(v)).isBlank()).toList();
        List<Evidence> evidence = described.stream().map(v -> new Evidence(v.getId(), v.getCaption(), v.getVideoUrl(),
                        Math.max(0, Objects.requireNonNullElse(v.getViewCount(), 0L)), v.getDurationSeconds(),
                        matches(text(v), keywords), matches(text(v), excluded)))
                .sorted(Comparator.comparingLong(Evidence::views).reversed().thenComparing(Evidence::videoId)).toList();
        int matching = (int) evidence.stream().filter(v -> !v.matchedKeywords().isEmpty()).count();
        List<String> matched = keywords.stream().filter(t -> evidence.stream().anyMatch(v -> v.matchedKeywords().contains(t))).toList();
        Integer fit = described.size() < 3 || keywords.isEmpty() ? null : (int) Math.round(matching * 100.0 / described.size());
        List<Topic> topics = topics(sample);
        List<DurationGroup> durations = durations(sample);
        List<Growth> growth = growth(sample, history, now);
        List<String> limits = new ArrayList<>(List.of(
                "Content match equals keyword-matching videos divided by videos with captions, hashtags or transcripts. It does not measure actual audience overlap and does not detect synonyms.",
                "Interest groups are hypotheses based on public content. Another channel's viewer age, gender, income, location and purchase rate cannot be determined.",
                "The sample includes up to 50 saved videos ordered by publication date and may be incomplete. Lifetime views depend on video age and do not prove that a topic or hashtag caused growth.",
                "Suggestions are content experiments, not probabilities of trending. Retention, completion, conversion and platform-wide trend data are unavailable."));
        if (described.size() < 10) limits.add("Fewer than 10 videos have readable content. Collect more data before drawing conclusions.");
        if (channel.getLastScrapedAt() == null || channel.getLastScrapedAt().isBefore(now.minus(Duration.ofDays(7))))
            limits.add("Channel data is stale or its collection time is unknown. Refresh the channel to reassess it.");
        if (growth.isEmpty()) limits.add("Growth requires two measurements of the same video at least 1 hour apart within the past 30 days. Growth is not inferred from lifetime views.");
        return new Report(channel.getTiktokUsername(), profile.getId(), profile.getName(), profile.getTargetAudience(),
                profile.getOffering(), profile.getGoal(), channel.getLastScrapedAt(), now, sample.size(), described.size(), matching, fit,
                matched, keywords.stream().filter(t -> !matched.contains(t)).toList(),
                (int) evidence.stream().filter(v -> !v.excludedKeywords().isEmpty()).count(), evidence, topics, durations, growth,
                experiments(profile, evidence, growth), limits);
    }

    private List<Topic> topics(List<TikTokVideo> sample) {
        Map<String, List<TikTokVideo>> groups = new TreeMap<>();
        for (TikTokVideo video : sample) {
            Set<String> unique = new HashSet<>();
            for (String tag : video.getHashtags() == null ? List.<String>of() : video.getHashtags()) {
                String key = normalize(tag).replace(" ", "");
                if (key.length() < 2 || GENERIC_TAGS.contains(key) || !unique.add(key)) continue;
                groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(video);
            }
        }
        return groups.entrySet().stream().filter(e -> e.getValue().size() >= 2)
                .map(e -> new Topic("#" + e.getKey(), e.getValue().size(), median(e.getValue()),
                        e.getValue().stream().map(TikTokVideo::getId).toList()))
                .sorted(Comparator.comparingInt(Topic::videoCount).reversed().thenComparing(Topic::hashtag)).limit(6).toList();
    }

    private List<DurationGroup> durations(List<TikTokVideo> sample) {
        Map<Integer, List<TikTokVideo>> groups = new TreeMap<>();
        for (TikTokVideo video : sample) {
            Integer duration = video.getDurationSeconds();
            if (duration == null || duration <= 0) continue;
            groups.computeIfAbsent(duration <= 30 ? 0 : duration <= 60 ? 1 : 2, ignored -> new ArrayList<>()).add(video);
        }
        return groups.entrySet().stream().map(e -> new DurationGroup(
                List.of("Up to 30 sec", "31–60 sec", "Over 60 sec").get(e.getKey()), e.getValue().size(), median(e.getValue()))).toList();
    }

    private long median(List<TikTokVideo> sample) {
        List<Long> values = sample.stream().map(v -> Math.max(0, Objects.requireNonNullElse(v.getViewCount(), 0L))).sorted().toList();
        int n = values.size();
        return n % 2 == 1 ? values.get(n / 2) : values.get(n / 2 - 1) + (values.get(n / 2) - values.get(n / 2 - 1)) / 2;
    }

    private List<Growth> growth(List<TikTokVideo> sample, List<VideoObservation> history, Instant now) {
        Map<Long, List<VideoObservation>> grouped = history.stream()
                .filter(o -> !o.getObservedAt().isAfter(now) && !o.getObservedAt().isBefore(now.minus(Duration.ofDays(30))))
                .collect(Collectors.groupingBy(o -> o.getVideo().getId()));
        List<Growth> growth = new ArrayList<>();
        for (TikTokVideo video : sample) {
            List<VideoObservation> points = grouped.getOrDefault(video.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(VideoObservation::getObservedAt)).toList();
            if (points.size() < 2) continue;
            VideoObservation latest = points.getLast();
            // The nearest eligible baseline keeps this a recent observed rate, rather than a lifetime average.
            VideoObservation baseline = points.stream().filter(p -> !p.getObservedAt().isAfter(latest.getObservedAt().minus(Duration.ofHours(1))))
                    .reduce((a, b) -> b).orElse(null);
            if (baseline == null || latest.getViewCount() < baseline.getViewCount()) continue;
            double hours = Duration.between(baseline.getObservedAt(), latest.getObservedAt()).toMillis() / 3600000.0;
            long delta = latest.getViewCount() - baseline.getViewCount();
            growth.add(new Growth(video.getId(), video.getCaption(), delta, Math.round(hours * 10.0) / 10.0,
                    Math.round(delta / hours * 10.0) / 10.0, baseline.getObservedAt(), latest.getObservedAt()));
        }
        return growth.stream().sorted(Comparator.comparingDouble(Growth::viewsPerHour).reversed()).limit(5).toList();
    }

    private List<Experiment> experiments(ResearchProfile profile, List<Evidence> evidence, List<Growth> growth) {
        Map<Long, Growth> rates = growth.stream().collect(Collectors.toMap(Growth::videoId, g -> g));
        Set<String> usedKeywords = new HashSet<>();
        return evidence.stream().filter(v -> !v.matchedKeywords().isEmpty() && v.excludedKeywords().isEmpty())
                .sorted(Comparator.<Evidence>comparingDouble(v -> rates.containsKey(v.videoId()) ? rates.get(v.videoId()).viewsPerHour() : -1)
                        .reversed().thenComparing(Comparator.comparingLong(Evidence::views).reversed()))
                .filter(v -> usedKeywords.add(normalize(v.matchedKeywords().getFirst())))
                .limit(3).map(v -> {
                    String topic = "Answer a specific question about " + v.matchedKeywords().getFirst()
                            + " for " + profile.getTargetAudience();
                    return new Experiment(topic,
                            (rates.containsKey(v.videoId())
                                    ? "Prioritize a video gaining an average of " + rates.get(v.videoId()).viewsPerHour() + " views/hour between two measurements"
                                    : "Reference a video with " + v.views() + " lifetime views") + " containing the keyword “" + v.matchedKeywords().getFirst()
                                    + "”. Adapt the example to your product or experience; do not copy the dialogue.",
                            "Test two hooks for the same topic and duration. Compare retention, completion and goal actions in TikTok Studio over equal periods after publication.",
                            Math.max(15, Math.min(600, v.durationSeconds() == null ? 60 : v.durationSeconds())), v);
                }).toList();
    }
}
