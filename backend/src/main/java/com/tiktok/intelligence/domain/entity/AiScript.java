package com.tiktok.intelligence.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.tiktok.intelligence.domain.enums.ScriptStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_scripts", indexes = {
    @Index(name = "idx_scripts_user", columnList = "user_id"),
    @Index(name = "idx_scripts_category", columnList = "category_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AiScript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    @JsonIgnore
    private AnalysisJob job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Category category;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "target_audience", length = 300)
    private String targetAudience;

    @Column(name = "hook_3s", nullable = false, columnDefinition = "TEXT")
    private String hook3s;

    @Column(name = "body_content", nullable = false, columnDefinition = "TEXT")
    private String bodyContent;

    @Column(name = "call_to_action", nullable = false, columnDefinition = "TEXT")
    private String callToAction;

    @Column(name = "visual_and_sound_cues", columnDefinition = "TEXT")
    private String visualAndSoundCues;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "suggested_hashtags")
    @Builder.Default
    private List<String> suggestedHashtags = new ArrayList<>();

    @Column(name = "estimated_duration_seconds")
    @Builder.Default
    private Integer estimatedDurationSeconds = 30;

    @Column(name = "requested_duration_seconds")
    private Integer requestedDurationSeconds;

    @Column(name = "ai_model_name", length = 255)
    @Builder.Default
    private String aiModelName = "claude-3-5-sonnet";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private ScriptStatus status = ScriptStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
