package com.tiktok.intelligence.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "application.aws")
@Getter
@Setter
public class AwsProperties {
    private String region = "ap-southeast-1";
    private String s3Bucket = "tiktok-intelligence-bucket";
    private String endpoint = "http://localhost:4566";
    private String accessKeyId = "mock_access_key";
    private String secretAccessKey = "mock_secret_key";
    private SqsProperties sqs = new SqsProperties();

    @Getter
    @Setter
    public static class SqsProperties {
        private String queueName = "tiktok-job-queue";
        private String dlqName = "tiktok-job-dlq";
        private boolean workerEnabled = true;
    }
}
