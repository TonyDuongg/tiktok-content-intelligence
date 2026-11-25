package com.tiktok.intelligence.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.service.storage.S3StorageService;
import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WorkspaceAccessTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired OpenAPI openApi;
    @MockBean S3StorageService storage;

    @Test
    void providerCatalogAndRequestCredentialsNeedNoAccountAndDoNotFallBackSilently() throws Exception {
        mvc.perform(get("/api/v1/ai/providers")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(4))
                .andExpect(jsonPath("$.data[0].id").value("gemini"))
                .andExpect(jsonPath("$.data[0].apiKey").doesNotExist());
        mvc.perform(post("/api/v1/ai/models").header("X-AI-Provider", "gemini"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("API key")));
        mvc.perform(post("/api/v1/ai/models").header("X-AI-Provider", "https://example.com").header("X-AI-Key", "invalid-fixture"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/scripts/generate").header("X-AI-Key", "invalid-fixture")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"topic\":\"Desk tips\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("provider")));
        mvc.perform(options("/api/v1/ai/models").header("Origin", "https://example.com")
                        .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "X-AI-Key,X-AI-Provider"))
                .andExpect(status().isOk());
    }

    @Test
    void workspaceIsAvailableWithoutAnAccount() throws Exception {
        for (String path : new String[]{"/api/v1/workspace/status", "/api/v1/categories", "/api/v1/scripts/my-scripts", "/api/v1/jobs/my-jobs"}) {
            mvc.perform(get(path)).andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true));
        }
    }

    @Test
    void legacyAuthorizationHeadersCannotBlockOrChangeTheWorkspace() throws Exception {
        for (String header : new String[]{"Bearer expired-token", "Bearer ", "Basic invalid"}) {
            mvc.perform(get("/api/v1/scripts/my-scripts").header("Authorization", header))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true));
        }
    }

    @Test
    void loginAndRegistrationAreNotPartOfTheTool() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isNotFound());
        mvc.perform(get("/login")).andExpect(status().isNotFound());
        for (String path : new String[]{"/api/v1/auth/login", "/api/v1/auth/register"}) {
            mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @WithMockUser(username = "user2@example.com")
    void identityInSecurityContextDoesNotSelectAnotherLibrary() throws Exception {
        // No such storage user is created: controllers must resolve the fixed tool workspace.
        mvc.perform(get("/api/v1/scripts/my-scripts")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/jobs/my-jobs")).andExpect(status().isOk());
    }

    @Test
    void generatedScriptCanBeReadAndUpdatedWithoutTokens() throws Exception {
        String result = mvc.perform(post("/api/v1/scripts/generate")
                        .header("Authorization", "Bearer old-browser-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Mẹo sắp xếp bàn học\",\"requestedDurationSeconds\":60}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(result).path("data").path("id").asLong();
        mvc.perform(get("/api/v1/scripts/" + id)).andExpect(status().isOk());
        mvc.perform(patch("/api/v1/scripts/" + id + "/status").param("status", "FAVORITE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("FAVORITE"));
        mvc.perform(get("/api/v1/scripts/" + id).header("Authorization", "Basic old-client"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("FAVORITE"));
    }

    @Test
    void apiDocumentationDoesNotRequireAuthorization() {
        assertThat(openApi.getSecurity()).isNullOrEmpty();
        if (openApi.getComponents() != null) {
            assertThat(openApi.getComponents().getSecuritySchemes()).isNullOrEmpty();
        }
    }
}
