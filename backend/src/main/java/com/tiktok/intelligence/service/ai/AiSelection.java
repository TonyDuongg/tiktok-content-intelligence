package com.tiktok.intelligence.service.ai;

/** Request-scoped credentials. Never persist or include them in diagnostic output. */
public record AiSelection(String provider, String model, String apiKey) {
    @Override public String toString() { return "AiSelection[credentials redacted]"; }
}
