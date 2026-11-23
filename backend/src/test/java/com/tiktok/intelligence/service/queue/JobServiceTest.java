package com.tiktok.intelligence.service.queue;

import com.tiktok.intelligence.domain.entity.AnalysisJob;
import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.JobStatus;
import com.tiktok.intelligence.domain.enums.JobType;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.dto.queue.JobMessageDto;
import com.tiktok.intelligence.dto.request.JobFilterRequest;
import com.tiktok.intelligence.dto.response.JobResponseDto;
import com.tiktok.intelligence.repository.AnalysisJobRepository;
import com.tiktok.intelligence.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private AnalysisJobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SqsProducerService sqsProducerService;

    private JobService jobService;

    @BeforeEach
    void setUp() {
        jobService = new JobService(jobRepository, userRepository, sqsProducerService);
    }

    @Test
    @DisplayName("Verify job creation, credit deduction and SQS dispatch")
    void testCreateAndDispatchJob() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("creator@example.com")
                .role(UserRole.ROLE_USER)
                .creditsBalance(50)
                .build();

        when(userRepository.findByEmail("creator@example.com")).thenReturn(Optional.of(user));

        AnalysisJob savedJob = AnalysisJob.builder()
                .id(UUID.randomUUID())
                .user(user)
                .jobType(JobType.ANALYZE_AND_GENERATE_SCRIPT)
                .status(JobStatus.PENDING)
                .filterParams(Map.of("nicheKeyword", "skincare"))
                .build();
        when(jobRepository.save(any(AnalysisJob.class))).thenReturn(savedJob);

        JobFilterRequest request = new JobFilterRequest(
                JobType.ANALYZE_AND_GENERATE_SCRIPT,
                1L,
                "skincare",
                List.of("beautytips_vn"),
                50000L,
                30,
                "Chân thực",
                "Phụ nữ 20-30",
                Map.of()
        );

        JobResponseDto response = jobService.createAndDispatchJob("creator@example.com", request);

        assertThat(response).isNotNull();
        assertThat(user.getCreditsBalance()).isEqualTo(45); // 50 - 5 = 45

        verify(sqsProducerService, times(1)).sendJobMessage(any(JobMessageDto.class));
        verify(jobRepository, times(2)).save(any(AnalysisJob.class));
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Verify rejection when user has insufficient credit balance")
    void testInsufficientCredits() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user2@example.com")
                .creditsBalance(2) // less than 5
                .build();

        when(userRepository.findByEmail("user2@example.com")).thenReturn(Optional.of(user));

        JobFilterRequest request = new JobFilterRequest(
                JobType.ANALYZE_AND_GENERATE_SCRIPT,
                null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> jobService.createAndDispatchJob("user2@example.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient credit balance");

        verify(sqsProducerService, never()).sendJobMessage(any());
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify IDOR protection: access denied when requesting another user's job")
    void testOtherUserCannotAccessJob() {
        UUID jobId = UUID.randomUUID();
        User owner = User.builder()
                .id(UUID.randomUUID())
                .email("creator@example.com")
                .role(UserRole.ROLE_USER)
                .build();

        AnalysisJob job = AnalysisJob.builder()
                .id(jobId)
                .user(owner)
                .status(JobStatus.COMPLETED)
                .build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> jobService.getJobById(jobId, "user2@example.com"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Access denied: You do not have permission to view this job");
    }
}
