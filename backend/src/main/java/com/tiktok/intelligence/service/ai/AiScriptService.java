package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.*;
import com.tiktok.intelligence.domain.enums.ScriptStatus;
import com.tiktok.intelligence.dto.ai.GeneratedScriptDto;
import com.tiktok.intelligence.dto.request.DirectGenerateScriptRequest;
import com.tiktok.intelligence.dto.response.ScriptDetailResponse;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiScriptService {

    private final List<AiScriptGeneratorClient> aiClients;
    private final AiScriptRepository scriptRepository;
    private final ScriptReferenceVideoRepository referenceVideoRepository;
    private final TikTokVideoRepository videoRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Value("${application.ai.provider:gemini}")
    private String activeProvider;

    public AiScriptGeneratorClient getActiveClient() {
        return aiClients.stream()
                .filter(client -> client.supports(activeProvider))
                .findFirst()
                .orElseThrow(() -> new com.tiktok.intelligence.exception.UpstreamServiceException(
                        "Nhà cung cấp AI chưa hợp lệ. Cấu hình AI_PROVIDER=gemini hoặc bedrock."));
    }

    @Transactional
    public AiScript generateAndSaveScriptForJob(AnalysisJob job) {
        log.info("Generating AI Script for Job [{}]", job.getId());
        User user = job.getUser();

        // 1. Resolve Category and Top Reference Videos
        Long categoryId = null;
        String nicheName = "Làm đẹp & Mỹ phẩm";
        if (job.getFilterParams().get("categoryId") != null) {
            categoryId = Long.valueOf(job.getFilterParams().get("categoryId").toString());
            Category cat = categoryRepository.findById(categoryId).orElse(null);
            if (cat != null) nicheName = cat.getName();
        }

        List<TikTokVideo> topVideos;
        if (categoryId != null) {
            topVideos = videoRepository.findTopViralVideosByNiche(categoryId, PageRequest.of(0, 5));
        } else {
            topVideos = videoRepository.findAll(PageRequest.of(0, 5)).getContent();
        }

        String targetAudience = (String) job.getFilterParams().getOrDefault("targetAudience", "Giới trẻ 18-30 tuổi");
        String tone = (String) job.getFilterParams().getOrDefault("tone", "Chân thực, thuyết phục");

        // 2. Invoke AI Model
        AiScriptGeneratorClient aiClient = getActiveClient();
        GeneratedScriptDto generatedDto = aiClient.generateScript(nicheName, targetAudience, tone, topVideos);

        // 3. Persist AiScript
        AiScript script = AiScript.builder()
                .job(job)
                .user(user)
                .category(categoryId != null ? categoryRepository.findById(categoryId).orElse(null) : null)
                .title(generatedDto.title())
                .targetAudience(generatedDto.targetAudience())
                .hook3s(generatedDto.hook3s())
                .bodyContent(generatedDto.bodyContent())
                .callToAction(generatedDto.callToAction())
                .visualAndSoundCues(generatedDto.visualAndSoundCues())
                .suggestedHashtags(generatedDto.suggestedHashtags())
                .estimatedDurationSeconds(generatedDto.estimatedDurationSeconds())
                .aiModelName(generatedDto.aiModelUsed())
                .status(ScriptStatus.DRAFT)
                .build();

        script = scriptRepository.save(script);

        // 4. Link Reference Videos
        List<ScriptReferenceVideo> references = new ArrayList<>();
        for (TikTokVideo refVideo : topVideos) {
            ScriptReferenceVideo ref = ScriptReferenceVideo.builder()
                    .script(script)
                    .video(refVideo)
                    .insightNote(String.format("Lấy cảm hứng từ hook mở đầu và cấu trúc giải quyết vấn đề (%.2f%% tương tác)", refVideo.getEngagementRate()))
                    .build();
            references.add(referenceVideoRepository.save(ref));
        }

        log.info("Persisted AI Script [{}] with {} reference videos", script.getId(), references.size());
        return script;
    }

    @Transactional
    public ScriptDetailResponse generateDirectScript(String userEmail, DirectGenerateScriptRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Category category = null;
        String contentBrief = request.topic().trim();
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lĩnh vực đã chọn"));
            contentBrief += "\nLĩnh vực: " + category.getName();
        }

        List<TikTokVideo> referenceVideos = new ArrayList<>();
        if (request.referenceVideoIds() != null && !request.referenceVideoIds().isEmpty()) {
            List<Long> ids = request.referenceVideoIds().stream().distinct().toList();
            referenceVideos = videoRepository.findAllById(ids);
            if (referenceVideos.size() != ids.size()) {
                throw new ResourceNotFoundException("Một số video tham khảo không còn tồn tại. Vui lòng chọn lại.");
            }
        }

        AiScriptGeneratorClient aiClient = getActiveClient();
        GeneratedScriptDto generated = aiClient.generateScript(
                contentBrief, request.targetAudience(), request.tone(), referenceVideos, request.durationSeconds()
        );

        AiScript script = AiScript.builder()
                .user(user)
                .category(category)
                .title(generated.title())
                .targetAudience(generated.targetAudience())
                .hook3s(generated.hook3s())
                .bodyContent(generated.bodyContent())
                .callToAction(generated.callToAction())
                .visualAndSoundCues(generated.visualAndSoundCues())
                .suggestedHashtags(generated.suggestedHashtags())
                .estimatedDurationSeconds(generated.estimatedDurationSeconds())
                .requestedDurationSeconds(request.durationSeconds())
                .aiModelName(generated.aiModelUsed())
                .status(ScriptStatus.DRAFT)
                .build();

        script = scriptRepository.save(script);
        List<ScriptReferenceVideo> references = new ArrayList<>();
        for (TikTokVideo video : referenceVideos) {
            references.add(referenceVideoRepository.save(ScriptReferenceVideo.builder()
                    .script(script)
                    .video(video)
                    .insightNote("Video được người dùng chọn làm tham khảo về cấu trúc và cách mở đầu")
                    .build()));
        }
        return ScriptDetailResponse.fromEntity(script, references);
    }

    @Transactional(readOnly = true)
    public ScriptDetailResponse getScriptDetail(Long scriptId, String userEmail) {
        AiScript script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found with ID: " + scriptId));
        requireOwner(script, userEmail);

        List<ScriptReferenceVideo> refs = referenceVideoRepository.findByScriptId(scriptId);
        return ScriptDetailResponse.fromEntity(script, refs);
    }

    @Transactional(readOnly = true)
    public List<ScriptDetailResponse> getUserScripts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        return scriptRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(s -> ScriptDetailResponse.fromEntity(s, referenceVideoRepository.findByScriptId(s.getId())))
                .toList();
    }

    @Transactional
    public ScriptDetailResponse updateScriptStatus(Long scriptId, ScriptStatus newStatus, String userEmail) {
        AiScript script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found with ID: " + scriptId));
        requireOwner(script, userEmail);

        script.setStatus(newStatus);
        script = scriptRepository.save(script);
        List<ScriptReferenceVideo> refs = referenceVideoRepository.findByScriptId(scriptId);
        return ScriptDetailResponse.fromEntity(script, refs);
    }

    private void requireOwner(AiScript script, String userEmail) {
        if (script.getUser() == null || !script.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập kịch bản này");
        }
    }
}
