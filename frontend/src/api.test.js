import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "./api.js";

test("tool requests ignore tokens left in browser storage and omit credentials", async () => {
  const previousFetch = globalThis.fetch;
  const previousStorage = globalThis.localStorage;
  const calls = [];
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("Tool must not read authentication storage");
    },
  };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200,
    });
  };
  try {
    await api.getMyScripts();
    await api.getWorkspaceStatus();
    assert.equal(calls.length, 2);
    for (const { options } of calls) {
      assert.equal(new Headers(options.headers).has("Authorization"), false);
      assert.equal(options.credentials, "omit");
    }
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.localStorage = previousStorage;
  }
});

test("provider errors remain visible without an authentication flow", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: "Gemini đang giới hạn yêu cầu.",
      }),
      { status: 503 },
    );
  try {
    await assert.rejects(
      api.getWorkspaceStatus(),
      /Gemini đang giới hạn yêu cầu/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("research configuration uses persisted CRUD endpoints and encodes comparison inputs", async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
  };
  try {
    await api.saveResearchProfile({ name: "Da dầu", keywords: "skincare" });
    await api.saveResearchProfile({ id: 12, name: "Đã sửa", keywords: "skincare" });
    await api.getChannelInsights("creator.name", 12);
    await api.deleteResearchProfile(12);
    assert.equal(calls[0].url, "/api/v1/research-profiles");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(JSON.parse(calls[0].options.body).name, "Da dầu");
    assert.equal(calls[1].url, "/api/v1/research-profiles/12");
    assert.equal(calls[1].options.method, "PUT");
    assert.equal(calls[2].url, "/api/v1/channels/creator.name/insights?profileId=12");
    assert.equal(calls[3].options.method, "DELETE");
  } finally { globalThis.fetch = previousFetch; }
});
