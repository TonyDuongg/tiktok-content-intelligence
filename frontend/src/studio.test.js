import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterScripts,
  normalizeUsername,
  readDraft,
  safeVideoUrl,
  scriptText,
  categoryKind,
  categoryLabel,
  durationToSeconds,
  formatDuration,
} from "./studio.js";

test("duration supports seconds, fractional minutes and whole-second boundaries", () => {
  assert.equal(durationToSeconds("90", "seconds"), 90);
  assert.equal(durationToSeconds("1.5", "minutes"), 90);
  assert.equal(durationToSeconds("0.25", "minutes"), 15);
  assert.equal(durationToSeconds("10", "minutes"), 600);
  for (const value of [
    "",
    " ",
    "14",
    "601",
    "30.5",
    "nope",
    Infinity,
    true,
    {},
  ]) {
    assert.equal(durationToSeconds(value, "seconds"), null);
  }
  assert.equal(durationToSeconds("1.001", "minutes"), null);
  assert.equal(formatDuration(90), "1 min 30 sec");
  assert.equal(formatDuration(120), "2 min");
  assert.equal(formatDuration(15), "15 sec");
});

test("draft restores custom duration and falls back safely for older drafts", () => {
  globalThis.localStorage = {
    getItem: () =>
      JSON.stringify({
        durationValue: "1.5",
        durationUnit: "minutes",
        customDuration: true,
      }),
  };
  assert.equal(
    durationToSeconds(readDraft().durationValue, readDraft().durationUnit),
    90,
  );
  assert.equal(readDraft().customDuration, true);
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ topic: "Nội dung cũ" }),
  };
  assert.equal(readDraft().durationValue, "60");
  assert.equal(readDraft().topic, "Nội dung cũ");
  globalThis.localStorage = {
    getItem: () =>
      JSON.stringify({ durationValue: "999", durationUnit: "minutes" }),
  };
  assert.equal(readDraft().durationValue, "60");
});

test("export keeps requested duration distinct from the AI estimate", () => {
  const text = scriptText({
    requestedDurationSeconds: 120,
    estimatedDurationSeconds: 115,
  });
  assert.ok(text.includes("Target duration: 2 min"));
  assert.ok(text.includes("115 sec (AI estimate)"));
});

test("normalizes TikTok handles and full profile URLs", () => {
  assert.equal(normalizeUsername(" @Creator.VN "), "creator.vn");
  assert.equal(
    normalizeUsername("https://www.tiktok.com/@Creator_VN/?lang=vi"),
    "creator_vn",
  );
  assert.equal(normalizeUsername("www.tiktok.com/@creator"), "creator");
});

test("uses the same category meaning for SQL seeds and local seeds", () => {
  assert.equal(categoryKind({ slug: "tech-gadgets" }), "tech");
  assert.equal(categoryKind({ slug: "cong-nghe-tien-ich" }), "tech");
  assert.equal(
    categoryLabel({ slug: "food-cooking", name: "Food & Cooking" }),
    "Food & cooking",
  );
});
test("rejects other hosts, video links, empty and malformed handles", () => {
  for (const value of [
    "",
    "@a",
    "has space",
    "x".repeat(25),
    "https://tiktok.com.evil.com/@creator",
    "https://example.com/@creator",
    "https://tiktok.com/@creator/video/123",
  ]) {
    assert.equal(normalizeUsername(value), null, value);
  }
});
test("exports duration from the API root and includes all script sections", () => {
  const text = scriptText({
    title: "Test",
    estimatedDurationSeconds: 48,
    aiModelUsed: "mock-template",
    scriptStructure: {
      hook3s: "Hook",
      bodyContent: "Body",
      callToAction: "CTA",
    },
    visualAndSoundCues: "Camera",
    suggestedHashtags: ["#tag"],
  });
  for (const value of [
    "48 sec",
    "mock-template",
    "Hook",
    "Body",
    "CTA",
    "Camera",
    "#tag",
  ])
    assert.ok(text.includes(value));
});
test("combines Vietnamese search with status filtering", () => {
  const scripts = [
    { title: "Chăm SÓC da", targetAudience: "Sinh viên", status: "DRAFT" },
    { title: "Công nghệ", status: "FAVORITE" },
  ];
  assert.equal(filterScripts(scripts, "chăm sóc", "ALL").length, 1);
  assert.equal(filterScripts(scripts, " sinh viên ", "DRAFT").length, 1);
  assert.equal(filterScripts(scripts, "chăm sóc", "FAVORITE").length, 0);
});
test("corrupt or blocked draft storage does not break startup", () => {
  globalThis.localStorage = { getItem: () => "{invalid" };
  assert.equal(readDraft().topic, "");
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("Blocked");
    },
  };
  assert.deepEqual(readDraft().references, []);
});
test("restored draft validates field types and bounds", () => {
  globalThis.localStorage = {
    getItem: () =>
      JSON.stringify({
        topic: "x".repeat(1200),
        targetAudience: {},
        references: [
          null,
          { id: -1 },
          { id: 2, caption: {} },
          { id: 2 },
          { id: 3 },
        ],
      }),
  };
  assert.equal(readDraft().topic.length, 1000);
  assert.equal(readDraft().targetAudience, "");
  assert.deepEqual(
    readDraft().references.map((v) => v.id),
    [2, 3],
  );
  assert.equal(readDraft().references[0].caption, "");
});
test("reference links allow HTTPS TikTok URLs only", () => {
  assert.ok(safeVideoUrl("https://www.tiktok.com/@creator/video/123"));
  for (const value of [
    "javascript:alert(1)",
    "http://tiktok.com/test",
    "https://tiktok.com.evil.com/test",
  ])
    assert.equal(safeVideoUrl(value), null);
});

test("migrates an earlier brief without reusing sample reference IDs", () => {
  globalThis.localStorage = {
    getItem: (key) =>
      key.endsWith("v1")
        ? JSON.stringify({ topic: "Chủ đề cũ", references: [{ id: 2 }] })
        : null,
  };
  assert.equal(readDraft().topic, "Chủ đề cũ");
  assert.deepEqual(readDraft().references, []);
});


test("English upgrade migrates built-in tones without translating user content", () => {
  const saved = { categoryId: 3, topic: "Chăm sóc da", targetAudience: "Sinh viên",
    tone: "Hài hước, dí dỏm", references: [{ id: 2, caption: "Mỹ phẩm", username: "creator" }] };
  globalThis.localStorage = { getItem: key => key === "creator-studio-draft-v2-live" ? JSON.stringify(saved) : null };
  const restored = readDraft();
  assert.equal(restored.tone, "Humorous and witty");
  assert.equal(restored.topic, saved.topic);
  assert.equal(restored.targetAudience, saved.targetAudience);
  assert.deepEqual(restored.references, saved.references);
  saved.tone = "Giọng riêng của tôi";
  assert.equal(readDraft().tone, saved.tone);
});
