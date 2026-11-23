package com.tiktok.intelligence.service.scraper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import com.tiktok.intelligence.dto.scraper.TikTokChannelProfileDto;
import com.tiktok.intelligence.dto.scraper.TikTokVideoDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class RapidApiTikTokScraperClient implements TikTokScraperClient {

    private final MockTikTokScraperClient fallbackMockClient;
    private final ObjectMapper objectMapper;

    @Value("${application.scraper.rapidapi-key:}")
    private String rapidApiKey;

    @Value("${application.scraper.rapidapi-host:tiktok-scraper7.p.rapidapi.com}")
    private String rapidApiHost;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([\\p{L}0-9_]+)");

    @Override
    public boolean supports(String provider) {
        return "rapidapi".equalsIgnoreCase(provider);
    }

    @Override
    public ScrapeResultDto scrapeChannel(String username, int maxVideos) {
        String cleanUsername = username.replace("@", "").trim();

        if (rapidApiKey == null || rapidApiKey.isBlank()
                || rapidApiKey.contains("your_key")
                || rapidApiKey.contains("cua_ban")) {
            log.warn("[RapidApi] RapidAPI key is not configured or placeholder detected. Falling back to mock data.");
            return fallbackMockClient.scrapeChannel(username, maxVideos);
        }

        try {
            log.info("[RapidApi] Fetching live TikTok profile & videos for @{} via host {}", cleanUsername, rapidApiHost);

            TikTokChannelProfileDto profile = fetchUserProfile(cleanUsername);
            if (profile == null) {
                log.warn("[RapidApi] Could not fetch profile for @{}. Falling back to mock data.", cleanUsername);
                return fallbackMockClient.scrapeChannel(username, maxVideos);
            }

            List<TikTokVideoDto> videos = fetchUserVideos(cleanUsername, Math.max(1, Math.min(maxVideos, 30)));
            if (videos.isEmpty()) {
                log.info("[RapidApi] No videos returned by API. Falling back to mock videos for profile @{}", cleanUsername);
                ScrapeResultDto mockFallback = fallbackMockClient.scrapeChannel(username, maxVideos);
                return ScrapeResultDto.of(profile, mockFallback.videos());
            }

            return ScrapeResultDto.of(profile, videos);
        } catch (Exception e) {
            log.error("[RapidApi] Unexpected error during RapidAPI fetch for @{}: {}. Falling back to mock data.",
                    cleanUsername, e.getMessage(), e);
            return fallbackMockClient.scrapeChannel(username, maxVideos);
        }
    }

    private TikTokChannelProfileDto fetchUserProfile(String username) {
        try {
            String encodedUsername = URLEncoder.encode(username, StandardCharsets.UTF_8);
            String url = String.format("https://%s/user/info?unique_id=%s", rapidApiHost, encodedUsername);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-rapidapi-key", rapidApiKey.trim())
                    .header("x-rapidapi-host", rapidApiHost.trim())
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("[RapidApi] Profile fetch returned HTTP {} for @{}: {}", response.statusCode(), username, response.body());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            int code = root.path("code").asInt(-1);
            if (code != 0 && code != 200) {
                log.warn("[RapidApi] Profile API returned error code {} for @{}: {}", code, username, root.path("msg").asText());
                return null;
            }

            JsonNode dataNode = root.has("data") ? root.path("data") : root;
            JsonNode userNode = dataNode.path("user");
            JsonNode statsNode = dataNode.path("stats");

            String nickname = userNode.path("nickname").asText(username);
            String avatarUrl = userNode.path("avatarLarger").asText(
                    userNode.path("avatarMedium").asText(
                            userNode.path("avatarThumb").asText("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200")
                    )
            );
            String bio = userNode.path("signature").asText("");
            long followers = statsNode.path("followerCount").asLong(0L);
            long totalLikes = statsNode.path("heartCount").asLong(statsNode.path("heart").asLong(0L));
            int totalVideos = statsNode.path("videoCount").asInt(0);

            return new TikTokChannelProfileDto(
                    username,
                    nickname,
                    avatarUrl,
                    bio,
                    followers,
                    totalLikes,
                    totalVideos
            );
        } catch (Exception e) {
            log.warn("[RapidApi] Failed to parse profile response: {}", e.getMessage());
            return null;
        }
    }

    private List<TikTokVideoDto> fetchUserVideos(String username, int maxVideos) {
        List<TikTokVideoDto> result = new ArrayList<>();
        try {
            String encodedUsername = URLEncoder.encode(username, StandardCharsets.UTF_8);
            String url = String.format("https://%s/user/posts?unique_id=%s&count=%d", rapidApiHost, encodedUsername, maxVideos);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-rapidapi-key", rapidApiKey.trim())
                    .header("x-rapidapi-host", rapidApiHost.trim())
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("[RapidApi] Video posts fetch returned HTTP {} for @{}: {}", response.statusCode(), username, response.body());
                return result;
            }

            JsonNode root = objectMapper.readTree(response.body());
            int code = root.path("code").asInt(-1);
            if (code != 0 && code != 200) {
                log.warn("[RapidApi] Video posts API returned error code {} for @{}: {}", code, username, root.path("msg").asText());
                return result;
            }

            JsonNode dataNode = root.has("data") ? root.path("data") : root;
            JsonNode videosNode = dataNode.path("videos");
            if (!videosNode.isArray()) {
                videosNode = dataNode.path("aweme_list");
            }

            if (videosNode.isArray()) {
                for (JsonNode v : videosNode) {
                    if (result.size() >= maxVideos) break;

                    String videoId = v.path("video_id").asText(v.path("id").asText("vid_" + System.currentTimeMillis()));
                    String caption = v.path("title").asText(v.path("desc").asText(""));
                    String coverUrl = v.path("cover").asText(v.path("origin_cover").asText(""));
                    String videoUrl = "https://www.tiktok.com/@" + username + "/video/" + videoId;

                    long views = v.path("play_count").asLong(0L);
                    long likes = v.path("digg_count").asLong(0L);
                    long comments = v.path("comment_count").asLong(0L);
                    long shares = v.path("share_count").asLong(0L);
                    int duration = v.path("duration").asInt(0);

                    String soundTitle = v.path("music_info").path("title").asText("Âm thanh gốc - " + username);

                    List<String> hashtags = new ArrayList<>();
                    Matcher matcher = HASHTAG_PATTERN.matcher(caption);
                    while (matcher.find()) {
                        hashtags.add("#" + matcher.group(1));
                    }

                    long createTime = v.path("create_time").asLong(0L);
                    Instant publishedAt = createTime > 0 ? Instant.ofEpochSecond(createTime) : Instant.now();

                    result.add(new TikTokVideoDto(
                            videoId,
                            videoUrl,
                            coverUrl,
                            caption,
                            hashtags,
                            views,
                            likes,
                            comments,
                            shares,
                            duration,
                            soundTitle,
                            caption, // Use caption as basic transcript text
                            publishedAt
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("[RapidApi] Failed to parse video posts response: {}", e.getMessage());
        }
        return result;
    }
}

