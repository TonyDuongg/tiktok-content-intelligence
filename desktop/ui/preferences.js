const $ = id => document.getElementById(id);
const links = { gemini: 'https://aistudio.google.com/api-keys', openai: 'https://platform.openai.com/api-keys', anthropic: 'https://platform.claude.com/settings/keys', xai: 'https://console.x.ai/' };
const drafts = Object.fromEntries(Object.keys(links).map(id => [id, { key: '', clear: false, model: '', models: [], configured: false, loading: false, status: '', version: 0 }]));
let selected = 'gemini', saving = false;
const showError = message => { $('error').textContent = message; $('error').hidden = !message; };
function render() {
  const state = drafts[selected];
  $('ai-provider').value = selected; $('ai-key').value = state.key; $('clear-ai').checked = state.clear;
  $('ai-status').textContent = state.configured ? '· Saved' : '';
  $('ai-key').placeholder = state.configured ? 'Leave blank to keep the saved key' : 'Enter your API key';
  $('clear-ai-label').hidden = !state.configured; $('key-link').href = links[selected];
  const options = [new Option(state.loading ? 'Loading models…' : 'Choose a model', '')];
  if (state.model && !state.models.some(m => m.id === state.model)) options.push(new Option(`${state.model} (saved ID)`, state.model));
  for (const m of state.models) options.push(new Option(m.name === m.id ? m.id : `${m.name} · ${m.id}`, m.id));
  $('ai-model').replaceChildren(...options); $('ai-model').value = state.model;
  $('custom-model').value = state.model;
  $('model-status').textContent = state.status || (state.configured ? 'Refresh to load models available to your key.' : 'Enter a key, then load its available models.');
  $('ai-model').disabled = state.loading || saving; $('refresh-models').disabled = state.loading || saving;
}
async function loadModels() {
  const id = selected, state = drafts[id], version = ++state.version;
  if (!state.key.trim() && (!state.configured || state.clear)) { state.status = 'Enter an API key before loading models.'; render(); return; }
  state.loading = true; state.status = 'Loading models from the provider…'; render();
  try {
    const result = await window.desktopSettings.models({ provider: id, apiKey: state.key, clear: state.clear });
    if (version !== state.version) return;
    state.models = result.models || [];
    state.status = result.error || (state.models.length ? `${state.models.length} text models found. Choose a model; provider charges and limits apply.` : 'No compatible text models were returned. Check your key permissions.');
  } catch { if (version === state.version) state.status = 'Unable to load models. Try again.'; }
  finally { if (version === state.version) state.loading = false; if (selected === id) render(); }
}
window.desktopSettings.load().then(settings => {
  selected = settings.provider;
  for (const id of Object.keys(drafts)) { drafts[id].model = settings.models[id] || ''; drafts[id].configured = settings.configured[id]; }
  $('rapid-status').textContent = settings.rapidApiConfigured ? '· Saved' : '';
  $('rapid-key').placeholder = settings.rapidApiConfigured ? 'Leave blank to keep the saved key' : 'Enter your RapidAPI key';
  $('clear-rapid-label').hidden = !settings.rapidApiConfigured; $('cancel').textContent = settings.firstRun ? 'Maybe later' : 'Close';
  render(); if (drafts[selected].configured) void loadModels();
}).catch(() => showError('Unable to load settings. Close and reopen this window.'));
$('ai-provider').addEventListener('change', () => { selected = $('ai-provider').value; render(); showError(''); if (drafts[selected].configured || drafts[selected].key.trim()) void loadModels(); });
$('ai-key').addEventListener('input', () => { const state = drafts[selected]; state.key = $('ai-key').value; state.models = []; state.version++; state.loading = false; state.status = 'Key changed. Refresh models to check access.'; $('model-status').textContent = state.status; });
$('ai-key').addEventListener('change', () => { if (drafts[selected].key.trim().length >= 8) void loadModels(); });
$('clear-ai').addEventListener('change', () => { const state = drafts[selected]; state.clear = $('clear-ai').checked; state.models = []; state.version++; state.loading = false; state.status = state.clear ? 'This key will be removed when you save.' : ''; render(); });
$('refresh-models').addEventListener('click', loadModels);
$('ai-model').addEventListener('change', () => { drafts[selected].model = $('ai-model').value; $('custom-model').value = drafts[selected].model; });
$('custom-model').addEventListener('input', () => { drafts[selected].model = $('custom-model').value; });
$('cancel').addEventListener('click', () => { if (!saving) void window.desktopSettings.close(); });
$('data-folder').addEventListener('click', () => void window.desktopSettings.openFolder());
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !saving) void window.desktopSettings.close(); });
$('settings-form').addEventListener('submit', async event => {
  event.preventDefault(); if (saving) return;
  const current = drafts[selected];
  if ((current.key.trim() || current.configured && !current.clear) && !current.model.trim()) { showError('Choose a model before saving this provider.'); return; }
  saving = true; showError('');
  const controls = [...document.querySelectorAll('input, select, button')]; controls.forEach(c => { c.disabled = true; });
  $('save').textContent = 'Saving and reconnecting…';
  try {
    const input = { provider: selected, models: {}, rapidApiKey: $('rapid-key').value, clearRapidApi: $('clear-rapid').checked };
    for (const [id, state] of Object.entries(drafts)) { input.models[id] = state.model; input[`${id}Key`] = state.key; input[`clear${id[0].toUpperCase()}${id.slice(1)}`] = state.clear; }
    const result = await window.desktopSettings.save(input);
    if (result.error) { showError(result.error); return; }
    await window.desktopSettings.close();
  } catch { showError('Unable to save settings. Check write permissions and try again.'); }
  finally { saving = false; controls.forEach(c => { c.disabled = false; }); $('save').textContent = 'Save settings'; render(); }
});
