package com.tiktok.intelligence.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TikTok Content Intelligence & AI Script Generator API")
                        .version("1.0.0")
                        .description("Shared workspace tool for TikTok research and script generation. No login or access token required.")
                        .contact(new Contact().name("TonyDuongg").url("https://github.com/TonyDuongg"))
                        .license(new License().name("MIT").url("https://github.com/TonyDuongg/tiktok-content-intelligence/blob/main/LICENSE")));
    }
}
