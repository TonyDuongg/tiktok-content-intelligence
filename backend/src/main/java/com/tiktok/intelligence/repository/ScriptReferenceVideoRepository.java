package com.tiktok.intelligence.repository;

import com.tiktok.intelligence.domain.entity.ScriptReferenceVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScriptReferenceVideoRepository extends JpaRepository<ScriptReferenceVideo, Long> {
    List<ScriptReferenceVideo> findByScriptId(Long scriptId);
}
