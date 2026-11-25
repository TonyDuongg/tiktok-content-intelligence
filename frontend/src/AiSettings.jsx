import { useEffect, useEffectEvent, useRef, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { api } from "./api";
import { Notice } from "./components";
import "./ai-settings.css";

const PROVIDERS = [
  ["gemini", "Google Gemini", "https://aistudio.google.com/api-keys"],
  ["openai", "OpenAI (GPT)", "https://platform.openai.com/api-keys"],
  ["anthropic", "Anthropic (Claude)", "https://platform.claude.com/settings/keys"],
  ["xai", "xAI (Grok)", "https://console.x.ai/"],
];

export default function AiSettings({ connection, workspace, onSave, onClose }) {
  const dialog = useRef(null);
  const request = useRef(null);
  const [provider, setProvider] = useState(connection.provider || (PROVIDERS.some(([id]) => id === workspace?.aiProvider) ? workspace.aiProvider : "gemini"));
  const [models, setModels] = useState({ ...connection.models });
  const [keys, setKeys] = useState({ ...connection.keys });
  const [providers, setProviders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const configured = providers.find(p => p.id === provider)?.configured;
  useEffect(() => {
    dialog.current.showModal();
    const controller = new AbortController();
    api.getAiProviders({ signal: controller.signal }).then(result => {
      setProviders(result.data || []);
      setModels(previous => Object.fromEntries(PROVIDERS.map(([id]) => [id, previous[id] || result.data?.find(p => p.id === id)?.model || ""])));
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => { controller.abort(); request.current?.abort(); };
  }, []);

  async function refresh(id = provider, key = keys[provider]) {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setCatalog([]); setError("");
    if (!key?.trim() && !providers.find(p => p.id === id)?.configured) { setStatus("Enter an API key to load its available models."); setLoading(false); return; }
    setLoading(true); setStatus("Loading models from the provider…");
    try {
      const result = await api.getAiModels(id, key?.trim(), { signal: controller.signal });
      if (controller.signal.aborted) return;
      setCatalog(result.data || []);
      setStatus(result.data?.length ? `${result.data.length} text models found. Choose a model; provider charges and limits apply.` : "No compatible text models returned. Check your key permissions.");
    } catch (e) { if (!controller.signal.aborted) { setError(e.message); setStatus(""); } }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const loadSelectedProvider = useEffectEvent(() => { void refresh(provider, keys[provider]); });
  useEffect(() => {
    const timer = setTimeout(loadSelectedProvider, 0);
    return () => { clearTimeout(timer); request.current?.abort(); };
    // Key changes are loaded on blur or by the explicit refresh action.
  }, [provider, providers]);
  function save(event) {
    event.preventDefault();
    if (!keys[provider]?.trim() && !configured) { setError("Enter an API key for this provider."); return; }
    if (!models[provider]?.trim()) { setError("Choose a model before applying settings."); return; }
    onSave({ provider, models, keys, serverConfigured: Object.fromEntries(providers.map(p => [p.id, p.configured])) });
  }
  return <dialog className="ai-dialog" ref={dialog} aria-labelledby="ai-settings-title" onCancel={onClose}>
    <form onSubmit={save}>
      <header><div><h2 id="ai-settings-title">AI settings</h2><p>Choose the provider and model for your scripts.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close AI settings"><X size={20} /></button></header>
      <div className="ai-dialog-content">
        <div className="field"><label htmlFor="web-ai-provider">AI provider</label><select id="web-ai-provider" value={provider} onChange={e => setProvider(e.target.value)}>{PROVIDERS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
        <div className="field"><label htmlFor="web-ai-key">API key</label><input id="web-ai-key" type="password" autoComplete="off" spellCheck={false} maxLength={4096} value={keys[provider] || ""} placeholder={configured ? "Leave blank to use this website's configured key" : "Enter your API key"}
          onChange={e => { request.current?.abort(); setLoading(false); setCatalog([]); setStatus("Key changed. Refresh models to check access."); setKeys(previous => ({ ...previous, [provider]: e.target.value })); }}
          onBlur={() => { if ((keys[provider] || "").trim().length >= 8) void refresh(); }} />
          <p className="field-hint"><a href={PROVIDERS.find(([id]) => id === provider)[2]} target="_blank" rel="noreferrer">Get an API key ↗</a>{configured && " · Blank uses this website's configured key."}</p>
        </div>
        <div className="field"><div className="label-row"><label htmlFor="web-ai-model">Model</label><button className="text-button" type="button" disabled={loading} onClick={() => refresh()}><RefreshCw size={14} /> Refresh models</button></div>
          <select id="web-ai-model" disabled={loading} value={models[provider] || ""} onChange={e => setModels(previous => ({ ...previous, [provider]: e.target.value }))}>
            <option value="">{loading ? "Loading models…" : "Choose a model"}</option>
            {models[provider] && !catalog.some(m => m.id === models[provider]) && <option value={models[provider]}>{models[provider]} (saved ID)</option>}
            {catalog.map(m => <option key={m.id} value={m.id}>{m.name === m.id ? m.id : `${m.name} · ${m.id}`}</option>)}
          </select><p className="field-hint" role="status" aria-live="polite">{status}</p>
        </div>
        <details className="ai-manual"><summary>Enter a model ID manually</summary><div className="field"><label htmlFor="web-ai-custom">Model ID</label><input id="web-ai-custom" maxLength={200} value={models[provider] || ""} onChange={e => setModels(previous => ({ ...previous, [provider]: e.target.value }))} /><p className="field-hint">Use this if the provider's catalog is unavailable. Model permissions and compatibility still apply.</p></div></details>
        <p className="ai-privacy">Your keys stay in this tab's memory and are cleared when you reload. Requests pass through this website's backend to the selected provider. Windows users can save encrypted keys in Settings.</p>
        {error && <Notice>{error}</Notice>}
      </div>
      <footer><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={loading}>Apply settings</button></footer>
    </form>
  </dialog>;
}
