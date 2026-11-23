package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TikTokVideoRepository extends JpaRepository<TikTokVideo, Long> {
    Optional<TikTokVideo> findByTiktokVideoId(String tiktokVideoId);
    boolean existsByTiktokVideoId(String tiktokVideoId);

    List<TikTokVideo> findByChannelIdOrderByEngagementRateDesc(Long channelId, Pageable pageable);

    @Query("SELECT v FROM TikTokVideo v WHERE v.channel.category.id = :categoryId ORDER BY v.engagementRate DESC")
    List<TikTokVideo> findTopViralVideosByNiche(@Param("categoryId") Long categoryId, Pageable pageable);
}
