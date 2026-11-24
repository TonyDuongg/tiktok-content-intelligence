package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Slf4j
@Component
@Profile("test")
public class MockAiScriptGenerator implements AiScriptGeneratorClient {

    @Override
    public boolean supports(String provider) {
        return "mock".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos, int durationSeconds) {
        log.info("[MockAiGenerator] Generating AI viral TikTok script for niche: '{}', audience: '{}'", nicheName, targetAudience);

        String topic = (nicheName != null && !nicheName.isBlank()) ? nicheName.lines().findFirst().orElse("Ý tưởng video") : "Ý tưởng video";

        return new GeneratedScriptDto(
                "Bản mẫu: " + topic.substring(0, Math.min(topic.length(), 160)),
                targetAudience != null ? targetAudience : "Người xem TikTok Việt Nam",
                "Bạn đang tìm hiểu về " + topic + "? Hãy bắt đầu từ điều này.",
                "[3–10 giây] Nêu vấn đề thực tế liên quan đến chủ đề: " + topic + ".\n\n"
                        + "[10–25 giây] Trình bày 2–3 ý chính, mỗi ý đi kèm một ví dụ bạn đã kiểm chứng.\n\n"
                        + "[25–30 giây] Minh họa cách áp dụng và nhắc lại ý quan trọng nhất.\n\n"
                        + "Đây là khung minh họa, hãy bổ sung nội dung thực tế trước khi quay.",
                "Lưu lại để thử và chia sẻ trải nghiệm của bạn trong phần bình luận.",
                "Cận mặt khi mở đầu. Chuyển sang cảnh minh họa theo từng ý chính; thêm phụ đề dễ đọc và nhạc nền nhỏ hơn giọng nói.",
                List.of("#sangtaonoidung", "#chiasekienthuc"),
                durationSeconds,
                "mock-template"
        );
    }
}
