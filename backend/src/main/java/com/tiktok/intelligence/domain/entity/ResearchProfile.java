package com.tiktok.intelligence.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;

@Entity
@Table(name = "research_profiles")
@Getter @Setter @NoArgsConstructor
public class ResearchProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100) private String name;
    @Column(length = 24) private String ownUsername;
    @Column(nullable = false, length = 300) private String targetAudience;
    @Column(length = 500) private String offering;
    @Column(length = 500) private String goal;
    @Column(nullable = false, length = 1000) private String keywords;
    @Column(length = 1000) private String excludedKeywords;
    @Column(length = 2000) private String analyticsNotes;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(nullable = false) private Instant updatedAt;
}
