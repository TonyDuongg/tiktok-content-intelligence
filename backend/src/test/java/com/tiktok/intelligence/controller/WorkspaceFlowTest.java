package com.tiktok.intelligence.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.service.storage.S3StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WorkspaceFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean S3StorageService storage;

    @Test
    void sampleResearchToScriptLibraryRoundTrip() throws Exception {
        mvc.perform(get("/api/v1/workspace/status"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.liveMode").value(true))
                .andExpect(jsonPath("$.data.aiConfigured").value(false));
        mvc.perform(post("/api/v1/channels/ingest").param("username", "test_creator").param("categoryId", "4"))
                .andExpect(status().isOk());
        String videos = mvc.perform(get("/api/v1/channels/test_creator/top-videos").param("limit", "5"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long videoId = mapper.readTree(videos).path("data").get(0).path("id").asLong();
        String response = mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":4,\"topic\":\"Sắp xếp điện thoại\",\"targetAudience\":\"Sinh viên\",\"tone\":\"Rõ ràng\",\"requestedDurationSeconds\":120,\"referenceVideoIds\":[" + videoId + "]}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.title").value("Sample: Sắp xếp điện thoại"))
                .andExpect(jsonPath("$.data.referenceVideos[0].videoId").value(videoId))
                .andExpect(jsonPath("$.data.requestedDurationSeconds").value(120))
                .andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(response).path("data").path("id").asLong();
        mvc.perform(patch("/api/v1/scripts/" + id + "/status").param("status", "FAVORITE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("FAVORITE"));
        mvc.perform(get("/api/v1/scripts/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requestedDurationSeconds").value(120))
                .andExpect(jsonPath("$.data.referenceVideos[0].videoId").value(videoId));
        mvc.perform(get("/api/v1/scripts/my-scripts")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void rejectsInvalidInputAsBadRequest() throws Exception {
        mvc.perform(post("/api/v1/channels/ingest")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/channels/ingest").param("username", "invalid name")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/channels/ingest").param("username", "creator").param("maxVideos", "500")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/channels/creator/top-videos").param("limit", "0")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON).content("{\"topic\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON).content("{\"topic\":\"Test\",\"referenceVideoIds\":[-1]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void frameworkErrorsKeepTheirHttpStatusInsteadOfBecomingServerFailures() throws Exception {
        mvc.perform(get("/api/v1/path-that-does-not-exist")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
        mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.TEXT_PLAIN).content("invalid"))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(delete("/api/v1/categories")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    void rejectsOutOfRangeDurationAndKeepsDefaultForOlderClients() throws Exception {
        mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Test\",\"requestedDurationSeconds\":15.5}"))
                .andExpect(status().isBadRequest());
        for (int duration : new int[]{0, 14, 601}) {
            mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"topic\":\"Test\",\"requestedDurationSeconds\":" + duration + "}"))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.requestedDurationSeconds").value(60));
        for (int duration : new int[]{15, 600}) {
            mvc.perform(post("/api/v1/scripts/generate").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"topic\":\"Test\",\"requestedDurationSeconds\":" + duration + "}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.requestedDurationSeconds").value(duration));
        }
    }
}
