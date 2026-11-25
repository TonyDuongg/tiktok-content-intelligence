package com.tiktok.intelligence.service.scraper;

import com.tiktok.intelligence.dto.scraper.ScrapeResultDto;
import com.tiktok.intelligence.dto.scraper.TikTokChannelProfileDto;
import com.tiktok.intelligence.dto.scraper.TikTokVideoDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@Profile("test")
public class MockTikTokScraperClient implements TikTokScraperClient {

    @Override
    public boolean supports(String provider) {
        return "mock".equalsIgnoreCase(provider);
    }

    @Override
    public ScrapeResultDto scrapeChannel(String username, int maxVideos) {
        String cleanUsername = username.replace("@", "").trim().toLowerCase(java.util.Locale.ROOT);
        Random random = new Random(cleanUsername.hashCode());
        log.info("[MockScraper] Generating mock TikTok dataset for channel: @{}", cleanUsername);

        TikTokChannelProfileDto profile = new TikTokChannelProfileDto(
                cleanUsername,
                "Kênh mẫu @" + cleanUsername,
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                "Hồ sơ minh họa để thử luồng nghiên cứu và tạo kịch bản. Không phải thông tin kênh thực tế.",
                385000L,
                4200000L,
                142
        );

        List<TikTokVideoDto> videos = new ArrayList<>();
        int count = Math.max(1, Math.min(maxVideos, 50));

        String[] sampleCaptions = {
                "3 Sai lầm chết người khi thoa kem chống nắng khiến da sạm đen #skincare #kemchongnang #lamdep",
                "Review chân thực serum dưỡng ẩm phục hồi B5 cho da dầu mụn #reviewmypham #serumb5 #duongda",
                "Cách chọn son môi tôn da cho người da ngăm bánh mật #makeup #sonmoi #goclamdep",
                "Routine dưỡng trắng da cấp tốc an toàn tại nhà chỉ sau 14 ngày #chamsocda #duongtrang",
                "Top 5 món mỹ phẩm giá rẻ dưới 100k chất lượng bất ngờ của học sinh sinh viên #myphamgiare #beautytips"
        };

        String[] sampleTranscripts = {
                "Đừng bao giờ bôi kem chống nắng trực tiếp lên da khô mốc. Bước một bạn phải dưỡng ẩm lót, bước hai vỗ nhẹ thay vì miết mạnh để lớp màng bảo vệ không bị vỡ.",
                "Rất nhiều bạn dùng B5 mà than mụn ẩn nhiều hơn là vì bạn apply trên nền da quá ẩm mà không khóa ẩm, khiến da bị bít tắc lỗ chân lông nghiêm trọng.",
                "Đừng chọn son theo trend nếu da bạn thuộc tone ấm. Hãy ưu tiên các màu đỏ gạch, cam đất có ánh nâu nhẹ để làm sáng răng và tôn màu da tự nhiên.",
                "Công thức dưỡng sáng an toàn: kết hợp Niacinamide nồng độ 5% vào buổi sáng và dưỡng ẩm phục hồi buổi tối, chống nắng phổ rộng mỗi 3 tiếng.",
                "Đây là 5 món đồ mỹ phẩm ngon bổ rẻ nhất mà sinh viên nào cũng nên có: nước tẩy trang dịu nhẹ, kem chống nắng kiềm dầu, và son dưỡng không màu."
        };

        for (int i = 0; i < count; i++) {
            int idx = i % sampleCaptions.length;
            long views = 80000L + random.nextInt(1500000);
            long likes = (long) (views * (0.05 + random.nextDouble() * 0.08));
            long comments = (long) (likes * 0.04);
            long shares = (long) (likes * 0.03);

            videos.add(new TikTokVideoDto(
                    "vid_" + cleanUsername + "_" + (1000 + i),
                    "", // Sample videos have no real TikTok URL.
                    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
                    sampleCaptions[idx],
                    List.of("#skincare", "#lamdep", "#reviewmypham", "#beauty"),
                    views,
                    likes,
                    comments,
                    shares,
                    35 + random.nextInt(40),
                    "Original sound - " + cleanUsername,
                    sampleTranscripts[idx],
                    Instant.now().minus(i * 2L + 1, ChronoUnit.DAYS)
            ));
        }

        return ScrapeResultDto.of(profile, videos);
    }
}
