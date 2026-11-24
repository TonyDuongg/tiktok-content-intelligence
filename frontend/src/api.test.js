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
