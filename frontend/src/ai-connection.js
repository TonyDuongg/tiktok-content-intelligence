const KEY = "creator-studio-ai-choice";
export function readAiChoice(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    return { provider: ["gemini", "openai", "anthropic", "xai"].includes(value?.provider) ? value.provider : "",
      models: Object.fromEntries(Object.entries(value?.models || {}).filter(([id, model]) => ["gemini", "openai", "anthropic", "xai"].includes(id) && typeof model === "string" && model.length <= 200)),
      keys: {}, serverConfigured: {} };
  } catch { return { provider: "", models: {}, keys: {}, serverConfigured: {} }; }
}
export function saveAiChoice(connection, storage = globalThis.localStorage) {
  storage.setItem(KEY, JSON.stringify({ provider: connection.provider, models: connection.models }));
}
export function aiReady(connection, workspace) {
  if (!connection.provider) return Boolean(workspace?.aiConfigured);
  return Boolean(connection.models[connection.provider] && (connection.keys[connection.provider] || connection.serverConfigured[connection.provider]));
}
