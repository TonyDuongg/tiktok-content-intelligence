package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiScriptPromptBuilder {

    public String buildPrompt(String nicheName, String targetAudience, String tone, List<TikTokVideo> topVideos) {
        return buildPrompt(nicheName, targetAudience, tone, topVideos, 60);
    }

    public String buildPrompt(String nicheName, String targetAudience, String tone, List<TikTokVideo> topVideos, int durationSeconds) {
        if (durationSeconds < 15 || durationSeconds > 600) throw new IllegalArgumentException("Duration must be between 15 and 600 seconds");
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là một chuyên gia sáng tạo nội dung hàng đầu trên TikTok tại Việt Nam.\n");
        sb.append("Nhiệm vụ của bạn là viết kịch bản có lời thoại hoàn chỉnh, mở đầu rõ và nội dung hữu ích, có thể tham khảo các video được chọn bên dưới.\n\n");

        sb.append("=== THÔNG TIN ĐỊNH HƯỚNG ===\n");
        sb.append("- Chủ đề và lĩnh vực: ").append(nicheName != null ? nicheName : "Đời sống").append("\n");
        sb.append("Bám sát chủ đề cụ thể người dùng yêu cầu. Video mẫu chỉ để tham khảo cấu trúc, không thay thế chủ đề và không sao chép lời thoại. Không tự tạo số liệu, cam kết hiệu quả hay tuyên bố y khoa chưa được kiểm chứng.\n");
        sb.append("Nếu không có transcript, chỉ tham khảo caption và chỉ số tương tác; không suy đoán lời thoại, cảnh quay hoặc âm thanh trong video tham khảo.\n");
        int ctaSeconds = durationSeconds <= 30 ? 3 : 5;
        sb.append(String.format("- Thời lượng mục tiêu: %d giây. Đây là tổng thời lượng gồm mở đầu, nội dung chính, chuyển cảnh và CTA.\n", durationSeconds));
        sb.append(String.format("- Phân bổ: hook3s từ 0–3 giây; bodyContent từ 3–%d giây; callToAction từ %d–%d giây.\n",
                durationSeconds - ctaSeconds, durationSeconds - ctaSeconds, durationSeconds));
        sb.append(String.format("- Ngân sách lời thoại tham khảo: khoảng %d–%d đơn vị tách bằng khoảng trắng cho TỔNG hook3s + bodyContent + callToAction. Đây là ước lượng nhịp đọc; chừa thời gian nghỉ và minh họa. Không chỉ đổi con số estimatedDurationSeconds để giả vờ đạt thời lượng.\n",
                Math.round(durationSeconds * 2.4), durationSeconds * 3));
        String paragraphs = durationSeconds <= 30 ? "1–2" : durationSeconds <= 90 ? "3–5" : durationSeconds <= 180 ? "6–10" : "10–20";
        sb.append("- Viết bodyContent thành ").append(paragraphs)
                .append(" đoạn lời thoại hoàn chỉnh, ngăn cách bằng hai ký tự xuống dòng. Mỗi đoạn bắt đầu bằng mốc [giây bắt đầu–giây kết thúc]. Mốc nối tiếp nhau, không chồng lấn, không vượt thời lượng mục tiêu. Viết đủ lời nói thực tế, không dùng mô tả chung hay dấu ba chấm thay nội dung. Với video dài, mở rộng bằng ví dụ và cách làm cụ thể, không lặp ý. visualAndSoundCues có gợi ý cảnh quay khớp các mốc.\n");
        sb.append("- Đối tượng mục tiêu: ").append(targetAudience != null ? targetAudience : "Giới trẻ 18-30 tuổi tại Việt Nam").append("\n");
        sb.append("- Văn phong/Tone giọng: ").append(tone != null ? tone : "Chân thực, cuốn hút, giải quyết vấn đề nhanh").append("\n\n");

        sb.append("=== VIDEO THAM KHẢO ĐƯỢC CHỌN ===\n");
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
            sb.append("Không có video tham khảo. Viết theo chủ đề; không tự nhận đang dựa trên xu hướng hoặc dữ liệu thời gian thực.\n");
        }

        sb.append("\n=== YÊU CẦU CẤU TRÚC KỊCH BẢN (BẮT BUỘC TRẢ VỀ ĐÚNG JSON THEO ĐỊNH DẠNG SAU) ===\n");
        sb.append("{\n");
        sb.append("  \"title\": \"Tiêu đề ngắn gọn, tối đa 140 ký tự\",\n");
        sb.append("  \"targetAudience\": \"Mô tả đối tượng người xem, tối đa 300 ký tự\",\n");
        sb.append("  \"hook3s\": \"Câu nói hoặc hành động mở đầu gây sốc/tò mò trong 3 giây đầu\",\n");
        sb.append("  \"bodyContent\": \"Nội dung chính giải quyết vấn đề một cách thực tế, mạch lạc\",\n");
        sb.append("  \"callToAction\": \"Lời kêu gọi hành động (Follow, lưu video, bình luận)\",\n");
        sb.append("  \"visualAndSoundCues\": \"Hướng dẫn góc máy quay, chữ hiển thị trên màn hình, hiệu ứng âm thanh\",\n");
        sb.append("  \"suggestedHashtags\": [\"#hashtag1\", \"#hashtag2\", \"#hashtag3\"],\n");
        sb.append("  \"estimatedDurationSeconds\": ").append(durationSeconds).append("\n");
        sb.append("}\n");

        return sb.toString();
    }
}
