package com.tiktok.intelligence.service.ai;

import com.tiktok.intelligence.domain.entity.TikTokVideo;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class AiScriptPromptBuilder {
    public String buildPrompt(String nicheName, String targetAudience, String tone, List<TikTokVideo> topVideos) {
        return buildPrompt(nicheName, targetAudience, tone, topVideos, 60);
    }

    public String buildPrompt(String nicheName, String targetAudience, String tone, List<TikTokVideo> topVideos, int durationSeconds) {
        if (durationSeconds < 15 || durationSeconds > 600) throw new IllegalArgumentException("Duration must be between 15 and 600 seconds");
        StringBuilder sb = new StringBuilder();
        sb.append("You are a TikTok content writer. Write all generated script fields in English, even when the brief or references use another language. Preserve proper names and relevant source hashtags.\n");
        sb.append("Write complete spoken dialogue with a clear opening and useful, practical content. Follow the user's topic. References inform structure only: do not copy dialogue or replace the topic.\n");
        sb.append("Do not invent statistics, results or unverified medical claims. Without a transcript, use captions and engagement only; do not infer the source video's dialogue, scenes or sound.\n\n");
        sb.append("=== BRIEF ===\nTopic and category: ").append(nicheName != null ? nicheName : "Lifestyle").append("\n");
        int ctaSeconds = durationSeconds <= 30 ? 3 : 5;
        sb.append(String.format("Target duration: %d seconds, including hook, body, transitions and CTA.\n", durationSeconds));
        sb.append(String.format("Timing: hook3s 0–3 seconds; bodyContent 3–%d seconds; callToAction %d–%d seconds.\n",
                durationSeconds - ctaSeconds, durationSeconds - ctaSeconds, durationSeconds));
        sb.append(String.format("Spoken-word budget: approximately %d–%d words across hook3s + bodyContent + callToAction. Allow time for pauses and demonstrations. Do not merely change estimatedDurationSeconds to claim a duration match.\n",
                Math.round(durationSeconds * 2.4), durationSeconds * 3));
        String paragraphs = durationSeconds <= 30 ? "1–2" : durationSeconds <= 90 ? "3–5" : durationSeconds <= 180 ? "6–10" : "10–20";
        sb.append("Write ").append(paragraphs).append(" paragraphs of complete dialogue in bodyContent, separated by two newline characters. Start each paragraph with [start second–end second]. Timestamps must be consecutive, non-overlapping and within the target duration. Use actual speech rather than outlines or ellipses. Expand longer videos with specific examples, without repetition. Match visualAndSoundCues to these timestamps.\n");
        sb.append("Target audience: ").append(targetAudience != null ? targetAudience : "TikTok viewers").append("\n");
        sb.append("Tone: ").append(tone != null ? tone : "Authentic, engaging and clear").append("\n\n");
        sb.append("=== SELECTED REFERENCES ===\n");
        if (topVideos != null && !topVideos.isEmpty()) {
            for (int i = 0; i < topVideos.size(); i++) {
                TikTokVideo v = topVideos.get(i);
                sb.append(String.format("[%d] Caption: %s | Views: %d | Engagement: %.2f%%\n",
                        i + 1, v.getCaption(), v.getViewCount(), v.getEngagementRate()));
                if (v.getTranscript() != null && !v.getTranscript().isBlank()) {
                    sb.append("Transcript: ").append(v.getTranscript()).append("\n");
                }
            }
        } else {
            sb.append("No reference videos. Follow the topic; do not claim to use live trends or real-time data.\n");
        }
        sb.append("\nReturn only valid JSON with exactly this structure, with English text values:\n");
        sb.append("{\n");
        sb.append("  \"title\": \"Concise title, at most 140 characters\",\n");
        sb.append("  \"targetAudience\": \"Audience description, at most 300 characters\",\n");
        sb.append("  \"hook3s\": \"Opening dialogue for the first 3 seconds\",\n");
        sb.append("  \"bodyContent\": \"Complete practical dialogue with timestamps\",\n");
        sb.append("  \"callToAction\": \"A clear call to follow, save or comment\",\n");
        sb.append("  \"visualAndSoundCues\": \"Camera, on-screen text and sound directions\",\n");
        sb.append("  \"suggestedHashtags\": [\"#topic\", \"#relevantTag\"],\n");
        sb.append("  \"estimatedDurationSeconds\": ").append(durationSeconds).append("\n}\n");
        return sb.toString();
    }
}
