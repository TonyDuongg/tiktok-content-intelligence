package com.tiktok.intelligence.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@RequiredArgsConstructor
public class AwsConfig {

    private final AwsProperties awsProperties;

    @Bean
    public S3Client s3Client() {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(awsProperties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(awsProperties.getAccessKeyId(), awsProperties.getSecretAccessKey())
                ));

        if (awsProperties.getEndpoint() != null && !awsProperties.getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(awsProperties.getEndpoint()))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());
        }

        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(awsProperties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(awsProperties.getAccessKeyId(), awsProperties.getSecretAccessKey())
                ));

        if (awsProperties.getEndpoint() != null && !awsProperties.getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(awsProperties.getEndpoint()))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());
        }

        return builder.build();
    }

    @Bean
    public software.amazon.awssdk.services.sqs.SqsClient sqsClient() {
        software.amazon.awssdk.services.sqs.SqsClientBuilder builder = software.amazon.awssdk.services.sqs.SqsClient.builder()
                .region(Region.of(awsProperties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(awsProperties.getAccessKeyId(), awsProperties.getSecretAccessKey())
                ));

        if (awsProperties.getEndpoint() != null && !awsProperties.getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(awsProperties.getEndpoint()));
        }

        return builder.build();
    }
}
