package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class MockAiScriptGenerator implements AiScriptGeneratorClient {

    @Override
    public boolean supports(String provider) {
        return "mock".equalsIgnoreCase(provider);
    }

    @Override
    public GeneratedScriptDto generateScript(String nicheName, String targetAudience, String tone, List<TikTokVideo> referenceVideos) {
        log.info("[MockAiGenerator] Generating AI viral TikTok script for niche: '{}', audience: '{}'", nicheName, targetAudience);

        String topic = (nicheName != null && !nicheName.isBlank()) ? nicheName : "Làm đẹp";

        return new GeneratedScriptDto(
                "3 Sai lầm khiến routine " + topic + " của bạn hoàn toàn vô tác dụng",
                targetAudience != null ? targetAudience : "Người trẻ 18-30 tuổi da dầu mụn",
                "Dừng lại ngay 3 giây! Đừng bao giờ làm điều này nếu bạn không muốn da mặt mình đổ dầu và nổi mụn mủ!",
                "Rất nhiều bạn nghĩ bôi càng nhiều lớp càng tốt. Nhưng sai lầm số 1 là apply sản phẩm khi da chưa kịp ráo. Sai lầm số 2 là dùng hoạt chất mạnh mà bỏ quên phục hồi. Thay vì vậy, hãy rút gọn routine chỉ còn 3 bước chuẩn: Làm sạch dịu nhẹ -> Serum phục hồi -> Khóa ẩm mỏng nhẹ.",
                "Lưu ngay video này lại để kiểm tra xem bạn có đang mắc phải lỗi nào không. Và đừng quên follow kênh để cập nhật mẹo chuẩn khoa học mỗi ngày!",
                "Góc máy cận mặt 3s đầu biểu cảm giật mình cảnh báo; góc máy 2 chuyển sang cận cảnh texture sản phẩm; nhạc nền beat lofi nhẹ nhàng có điểm nhấn sound effect ding-dong.",
                List.of("#" + topic.toLowerCase().replace(" ", ""), "#chamsocda", "#reviewmypham", "#goclamdep", "#viral"),
                35,
                "mock-claude-3-5-sonnet"
        );
    }
}
