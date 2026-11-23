package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.*;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.domain.enums.JobType;
import com.tiktok.intelligence.domain.enums.ScriptStatus;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import com.tiktok.intelligence.dto.request.DirectGenerateScriptRequest;
import com.tiktok.intelligence.dto.response.ScriptDetailResponse;
import com.tiktok.intelligence.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiScriptServiceTest {

    @Mock
    private AiScriptGeneratorClient aiClient;

    @Mock
    private AiScriptRepository scriptRepository;

    @Mock
    private ScriptReferenceVideoRepository referenceVideoRepository;

    @Mock
    private TikTokVideoRepository videoRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    private AiScriptService aiScriptService;

    @BeforeEach
    void setUp() {
        lenient().when(aiClient.supports("mock")).thenReturn(true);

        aiScriptService = new AiScriptService(
                List.of(aiClient),
                scriptRepository,
                referenceVideoRepository,
                videoRepository,
                categoryRepository,
                userRepository
        );
        ReflectionTestUtils.setField(aiScriptService, "activeProvider", "mock");
    }

    @Test
    @DisplayName("Verify generating and saving AI script for analysis job")
    void testGenerateAndSaveScriptForJob() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("creator@example.com")
                .role(UserRole.ROLE_USER)
                .build();

        Category category = Category.builder()
                .id(1L)
                .name("Mỹ phẩm & Skincare")
                .slug("my-pham-skincare")
                .build();

        AnalysisJob job = AnalysisJob.builder()
                .id(UUID.randomUUID())
                .user(user)
                .jobType(JobType.ANALYZE_AND_GENERATE_SCRIPT)
                .status(JobStatus.PROCESSING)
                .filterParams(Map.of("categoryId", 1L, "targetAudience", "Da dầu mụn"))
                .build();

        TikTokVideo video = TikTokVideo.builder()
                .id(100L)
                .tiktokVideoId("vid_100")
                .videoUrl("https://tiktok.com/@test/100")
                .caption("Kem chống nắng chân ái")
                .viewCount(200000L)
                .engagementRate(new BigDecimal("9.500"))
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(videoRepository.findTopViralVideosByNiche(eq(1L), any(Pageable.class))).thenReturn(List.of(video));

        GeneratedScriptDto generatedDto = new GeneratedScriptDto(
                "3 Lỗi thoa kem chống nắng",
                "Da dầu mụn",
                "Đừng thoa trực tiếp lên da!",
                "Thoa dưỡng lót trước 5 phút...",
                "Lưu video ngay!",
                "Góc quay cận cảnh",
                List.of("#skincare", "#lamdep"),
                30,
                "claude-3-5-sonnet"
        );
        when(aiClient.generateScript(anyString(), anyString(), anyString(), anyList())).thenReturn(generatedDto);

        when(scriptRepository.save(any(AiScript.class))).thenAnswer(i -> {
            AiScript s = i.getArgument(0);
            s.setId(42L);
            return s;
        });

        when(referenceVideoRepository.save(any(ScriptReferenceVideo.class))).thenAnswer(i -> i.getArgument(0));

        AiScript savedScript = aiScriptService.generateAndSaveScriptForJob(job);

        assertThat(savedScript).isNotNull();
        assertThat(savedScript.getTitle()).isEqualTo("3 Lỗi thoa kem chống nắng");
        assertThat(savedScript.getHook3s()).isEqualTo("Đừng thoa trực tiếp lên da!");

        verify(scriptRepository, times(1)).save(any(AiScript.class));
        verify(referenceVideoRepository, times(1)).save(any(ScriptReferenceVideo.class));
    }

    @Test
    @DisplayName("Verify generating direct script by topic")
    void testGenerateDirectScript() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("creator@example.com")
                .build();

        when(userRepository.findByEmail("creator@example.com")).thenReturn(Optional.of(user));

        GeneratedScriptDto generatedDto = new GeneratedScriptDto(
                "Bí quyết phối đồ mùa đông",
                "Gen Z",
                "Mặc sao cho ngầu?",
                "Kết hợp áo blazer và hoodie...",
                "Follow để nhận thêm outfit!",
                "Nhạc lofi",
                List.of("#fashion", "#outfit"),
                30,
                "mock-model"
        );
        when(aiClient.generateScript(anyString(), anyString(), anyString(), anyList())).thenReturn(generatedDto);

        when(scriptRepository.save(any(AiScript.class))).thenAnswer(i -> {
            AiScript s = i.getArgument(0);
            s.setId(99L);
            return s;
        });

        DirectGenerateScriptRequest request = new DirectGenerateScriptRequest(
                null, "Thời trang mùa đông", "Gen Z", "Trẻ trung", List.of()
        );

        ScriptDetailResponse response = aiScriptService.generateDirectScript("creator@example.com", request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.title()).isEqualTo("Bí quyết phối đồ mùa đông");
        assertThat(response.scriptStructure().hook3s()).isEqualTo("Mặc sao cho ngầu?");
    }

    @Test
    @DisplayName("Verify updating script status to FAVORITE")
    void testUpdateScriptStatus() {
        AiScript script = AiScript.builder()
                .id(50L)
                .title("Test Script")
                .status(ScriptStatus.DRAFT)
                .hook3s("Hook")
                .bodyContent("Body")
                .callToAction("CTA")
                .build();

        when(scriptRepository.findById(50L)).thenReturn(Optional.of(script));
        when(scriptRepository.save(any(AiScript.class))).thenAnswer(i -> i.getArgument(0));
        when(referenceVideoRepository.findByScriptId(50L)).thenReturn(List.of());

        ScriptDetailResponse response = aiScriptService.updateScriptStatus(50L, ScriptStatus.FAVORITE, "creator@example.com");

        assertThat(response.status()).isEqualTo(ScriptStatus.FAVORITE);
        verify(scriptRepository, times(1)).save(script);
    }
}
