package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiScriptPromptBuilder {

    public String buildPrompt(String nicheName, String targetAudience, String tone, List<TikTokVideo> topVideos) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là một chuyên gia sáng tạo nội dung hàng đầu trên TikTok tại Việt Nam.\n");
        sb.append("Nhiệm vụ của bạn là phân tích công thức thành công từ các video triệu view dưới đây và sáng tạo 1 kịch bản video ngắn mới theo cấu trúc chuẩn viral.\n\n");

        sb.append("=== THÔNG TIN ĐỊNH HƯỚNG ===\n");
        sb.append("- Ngành hàng/Chủ đề: ").append(nicheName != null ? nicheName : "Làm đẹp & Đời sống").append("\n");
        sb.append("- Đối tượng mục tiêu: ").append(targetAudience != null ? targetAudience : "Giới trẻ 18-30 tuổi tại Việt Nam").append("\n");
        sb.append("- Văn phong/Tone giọng: ").append(tone != null ? tone : "Chân thực, cuốn hút, giải quyết vấn đề nhanh").append("\n\n");

        sb.append("=== DANH SÁCH VIDEO MẪU TOP TƯƠNG TÁC CAO NHẤT ===\n");
        if (topVideos != null && !topVideos.isEmpty()) {
            for (int i = 0; i < topVideos.size(); i++) {
                TikTokVideo v = topVideos.get(i);
                sb.append(String.format("[%d] Tiêu đề/Caption: %s | Lượt xem: %d | Engagement: %.2f%%\n",
                        i + 1, v.getCaption(), v.getViewCount(), v.getEngagementRate()));
                if (v.getTranscript() != null && !v.getTranscript().isBlank()) {
                    sb.append("    Lời thoại/Transcript: \"").append(v.getTranscript()).append("\"\n");
                }
            }
        } else {
            sb.append("Chưa có video mẫu. Hãy sáng tạo kịch bản dựa trên các xu hướng thịnh hành nhất của ngành hàng.\n");
        }

        sb.append("\n=== YÊU CẦU CẤU TRÚC KỊCH BẢN (BẮT BUỘC TRẢ VỀ ĐÚNG JSON THEO ĐỊNH DẠNG SAU) ===\n");
        sb.append("{\n");
        sb.append("  \"title\": \"Tiêu đề hấp dẫn của video\",\n");
        sb.append("  \"targetAudience\": \"Mô tả ngắn đối tượng người xem\",\n");
        sb.append("  \"hook3s\": \"Câu nói hoặc hành động mở đầu gây sốc/tò mò trong 3 giây đầu\",\n");
        sb.append("  \"bodyContent\": \"Nội dung chính giải quyết vấn đề một cách thực tế, mạch lạc\",\n");
        sb.append("  \"callToAction\": \"Lời kêu gọi hành động (Follow, lưu video, bình luận)\",\n");
        sb.append("  \"visualAndSoundCues\": \"Hướng dẫn góc máy quay, chữ hiển thị trên màn hình, hiệu ứng âm thanh\",\n");
        sb.append("  \"suggestedHashtags\": [\"#hashtag1\", \"#hashtag2\", \"#hashtag3\"],\n");
        sb.append("  \"estimatedDurationSeconds\": 35\n");
        sb.append("}\n");

        return sb.toString();
    }
}
