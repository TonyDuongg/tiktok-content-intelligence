package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.TikTokChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TikTokChannelRepository extends JpaRepository<TikTokChannel, Long> {
    List<TikTokChannel> findAllByOrderByLastScrapedAtDesc();
    Optional<TikTokChannel> findByTiktokUsername(String tiktokUsername);
    boolean existsByTiktokUsername(String tiktokUsername);
    List<TikTokChannel> findByCategoryId(Long categoryId);
}
