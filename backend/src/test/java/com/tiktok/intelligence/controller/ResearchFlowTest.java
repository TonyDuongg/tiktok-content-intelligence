package com.tiktok.intelligence.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.domain.entity.*;
import com.tiktok.intelligence.repository.*;
import com.tiktok.intelligence.service.storage.S3StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Transactional
class ResearchFlowTest {
    @Autowired org.springframework.test.web.servlet.MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired TikTokChannelRepository channels;
    @Autowired TikTokVideoRepository videos;
    @Autowired VideoObservationRepository observations;
    @MockBean S3StorageService storage;

    @Test void persistsProfilesAndAnalyzesSavedChannelsWithoutProviderCalls() throws Exception {
        var payload = new HashMap<String, Object>(Map.of("name", "Sinh viên", "ownUsername", "@my_channel",
                "targetAudience", "Sinh viên cần chăm sóc da", "keywords", "da dầu", "excludedKeywords", "thuốc lá"));
        String created = mvc.perform(post("/api/v1/research-profiles").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(payload)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.ownUsername").value("my_channel"))
                .andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(created).path("data").path("id").asLong();
        mvc.perform(get("/api/v1/research-profiles")).andExpect(status().isOk()).andExpect(jsonPath("$.data[0].name").value("Sinh viên"));
        payload.put("name", "Sinh viên da dầu");
        mvc.perform(put("/api/v1/research-profiles/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.name").value("Sinh viên da dầu"));
        TikTokChannel channel = channels.saveAndFlush(TikTokChannel.builder().tiktokUsername("research_test").lastScrapedAt(Instant.now()).build());
        for (int i = 0; i < 3; i++) videos.saveAndFlush(TikTokVideo.builder().channel(channel).tiktokVideoId("research-video-" + i)
                .videoUrl("https://www.tiktok.com/@research_test/video/" + i).caption("Chăm sóc da dầu").viewCount(100L).build());
        mvc.perform(get("/api/v1/channels")).andExpect(status().isOk()).andExpect(jsonPath("$.data").isArray());
        mvc.perform(get("/api/v1/channels/research_test/insights").param("profileId", String.valueOf(id)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.contentMatchPercent").value(100))
                .andExpect(jsonPath("$.data.profileName").value("Sinh viên da dầu"))
                .andExpect(jsonPath("$.data.growth").isEmpty());
        mvc.perform(delete("/api/v1/research-profiles/" + id)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/channels/research_test")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/channels/research_test/insights").param("profileId", String.valueOf(id))).andExpect(status().isNotFound());
    }

    @Test void rejectsInvalidProfilesRatherThanSavingUnusableConfiguration() throws Exception {
        mvc.perform(post("/api/v1/research-profiles").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/research-profiles").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"test\",\"targetAudience\":\"test\",\"keywords\":\"!!!\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("từ khóa")));
        mvc.perform(get("/api/v1/channels/unknown/insights").param("profileId", "0")).andExpect(status().isBadRequest());
    }

    @Test void channelRefreshPersistsTwoObservationBatchesWithoutInventingAnHourlyRate() throws Exception {
        for (int i = 0; i < 2; i++) mvc.perform(post("/api/v1/channels/ingest")
                        .param("username", "snapshot_creator").param("maxVideos", "3"))
                .andExpect(status().isOk());
        TikTokChannel channel = channels.findByTiktokUsername("snapshot_creator").orElseThrow();
        var saved = videos.findRecentForInsights(channel.getId(), org.springframework.data.domain.PageRequest.of(0, 50));
        var points = observations.findByVideoIdInAndObservedAtGreaterThanEqualOrderByObservedAtAsc(
                saved.stream().map(TikTokVideo::getId).toList(), Instant.now().minusSeconds(60));
        org.assertj.core.api.Assertions.assertThat(saved).isNotEmpty();
        org.assertj.core.api.Assertions.assertThat(points).hasSize(saved.size() * 2);
        org.assertj.core.api.Assertions.assertThat(points).allMatch(p -> p.getViewCount() >= 0 && p.getObservedAt() != null);
    }
}
