package com.tiktok.intelligence.service.storage;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.config.AwsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsProperties awsProperties;
    private final ObjectMapper objectMapper;

    public void ensureBucketExists() {
        String bucket = awsProperties.getS3Bucket();
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            log.info("S3 Bucket '{}' does not exist. Creating new bucket...", bucket);
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            log.info("S3 Bucket '{}' created successfully.", bucket);
        } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException e) {
            log.debug("S3 Bucket '{}' already exists.", bucket);
        } catch (Exception e) {
            log.warn("Could not verify S3 bucket '{}': {}", bucket, e.getMessage());
        }
    }

    public String uploadJsonPayload(String key, Object payload) {
        String bucket = awsProperties.getS3Bucket();
        try {
            ensureBucketExists();
            String jsonContent = objectMapper.writeValueAsString(payload);
            byte[] bytes = jsonContent.getBytes(StandardCharsets.UTF_8);

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType("application/json")
                    .contentLength((long) bytes.length)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(bytes));
            String s3Uri = String.format("s3://%s/%s", bucket, key);
            log.info("Uploaded JSON payload to S3: {}", s3Uri);
            return s3Uri;
        } catch (Exception e) {
            log.error("Failed to upload JSON payload to S3 [bucket={}, key={}]: {}", bucket, key, e.getMessage());
            throw new RuntimeException("Failed to store data in S3: " + e.getMessage(), e);
        }
    }

    public String generatePresignedDownloadUrl(String key, Duration expiration) {
        String bucket = awsProperties.getS3Bucket();
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration != null ? expiration : Duration.ofHours(1))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            log.error("Failed to generate presigned download URL for S3 key '{}': {}", key, e.getMessage());
            return null;
        }
    }
}
