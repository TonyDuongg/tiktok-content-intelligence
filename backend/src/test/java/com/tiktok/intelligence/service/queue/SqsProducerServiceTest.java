package com.tiktok.intelligence.service.queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tiktok.intelligence.config.AwsProperties;
import com.tiktok.intelligence.domain.enums.JobType;
import com.tiktok.intelligence.dto.queue.JobMessageDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SqsProducerServiceTest {

    @Mock
    private SqsClient sqsClient;

    private AwsProperties awsProperties;
    private SqsProducerService producerService;

    @BeforeEach
    void setUp() {
        awsProperties = new AwsProperties();
        awsProperties.getSqs().setQueueName("test-queue");
        awsProperties.getSqs().setDlqName("test-dlq");

        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

        producerService = new SqsProducerService(sqsClient, awsProperties, objectMapper);
    }

    @Test
    @DisplayName("Verify resolving queue URL and creating if non-existent")
    void testResolveQueueUrl() {
        when(sqsClient.getQueueUrl(any(GetQueueUrlRequest.class)))
                .thenReturn(GetQueueUrlResponse.builder().queueUrl("https://sqs.test/test-queue").build());

        String queueUrl = producerService.resolveQueueUrl("test-queue");

        assertThat(queueUrl).isEqualTo("https://sqs.test/test-queue");
        verify(sqsClient, times(1)).getQueueUrl(any(GetQueueUrlRequest.class));
    }

    @Test
    @DisplayName("Verify sending job message to SQS")
    void testSendJobMessage() {
        when(sqsClient.getQueueUrl(any(GetQueueUrlRequest.class)))
                .thenReturn(GetQueueUrlResponse.builder().queueUrl("https://sqs.test/test-queue").build());

        when(sqsClient.sendMessage(any(SendMessageRequest.class)))
                .thenReturn(SendMessageResponse.builder().messageId("msg_12345").build());

        JobMessageDto message = JobMessageDto.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                JobType.ANALYZE_AND_GENERATE_SCRIPT,
                Map.of("niche", "makeup")
        );

        producerService.sendJobMessage(message);

        verify(sqsClient, times(1)).sendMessage(any(SendMessageRequest.class));
    }
}
