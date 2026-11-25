const path = require('node:path');
const PROVIDERS = Object.freeze(['gemini', 'openai', 'anthropic', 'xai']);
const DEFAULT_SETTINGS = Object.freeze({ provider: 'gemini',
  models: Object.freeze({ gemini: 'gemini-3.5-flash', openai: '', anthropic: '', xai: '' }),
  geminiKey: '', openaiKey: '', anthropicKey: '', xaiKey: '', rapidApiKey: '' });

function mergeSettings(input, previous = DEFAULT_SETTINGS) {
  if (!input || typeof input !== 'object') throw new Error('Invalid settings.');
  const provider = input.provider ?? previous.provider ?? 'gemini';
  if (!PROVIDERS.includes(provider)) throw new Error('Choose a supported AI provider.');
  const models = { ...DEFAULT_SETTINGS.models, ...previous.models };
  if (!previous.models && previous.model) models.gemini = previous.model;
  if (input.model !== undefined) models.gemini = input.model;
  for (const id of PROVIDERS) {
    const value = input.models?.[id] ?? models[id];
    if (typeof value !== 'string' || (value.trim() && (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(value.trim()) || value.includes('..')))) throw new Error('Invalid model ID.');
    models[id] = value.trim();
  }
  const result = { provider, models };
  for (const [field, clear] of [...PROVIDERS.map(id => [`${id}Key`, `clear${id[0].toUpperCase()}${id.slice(1)}`]), ['rapidApiKey', 'clearRapidApi']]) {
    const value = input[field] ?? '';
    if (typeof value !== 'string' || /[^\x20-\x7e]/.test(value) || value.length > 4096) throw new Error('Invalid API key. Check it and enter it again.');
    result[field] = input[clear] === true ? '' : value.trim() || previous[field] || '';
  }
  return result;
}
async function encodeSettings(settings, crypto) {
  if ([...PROVIDERS.map(id => settings[`${id}Key`]), settings.rapidApiKey].some(Boolean) && !await crypto.isAsyncEncryptionAvailable()) throw new Error('Windows encrypted key storage is unavailable. Restart the application and try again.');
  const encrypt = async value => value ? (await crypto.encryptStringAsync(value)).toString('base64') : '';
  const keys = {};
  for (const id of PROVIDERS) keys[id] = await encrypt(settings[`${id}Key`]);
  return { version: 2, provider: settings.provider, models: settings.models, keys, rapidApi: await encrypt(settings.rapidApiKey) };
}
async function decodeSettings(record, crypto) {
  if (![1, 2].includes(record.version)) throw new Error('Unsupported settings format.');
  const decrypt = async value => value ? (await crypto.decryptStringAsync(Buffer.from(value, 'base64'))).result : '';
  const input = { provider: record.version === 1 ? 'gemini' : record.provider, models: record.models, rapidApiKey: await decrypt(record.rapidApi) };
  if (record.version === 1) { input.model = record.model; input.geminiKey = await decrypt(record.gemini); }
  else for (const id of PROVIDERS) input[`${id}Key`] = await decrypt(record.keys?.[id]);
  return mergeSettings(input);
}
function backendEnvironment(base, settings, dataDirectory) {
  const env = { ...base };
  for (const key of Object.keys(env)) {
    if (/^(SPRING_|APPLICATION_|AWS_|AI_|GEMINI_|OPENAI_|ANTHROPIC_|XAI_|RAPIDAPI_|SCRAPER_|VITE_|SERVER_|MANAGEMENT_|LOGGING_)/.test(key)
      || ['DEBUG', 'TRACE', 'LOCAL_DATABASE_URL', 'S3_ARCHIVE_ENABLED', 'SQS_WORKER_ENABLED', 'JAVA_HOME', 'JRE_HOME', 'CLASSPATH', 'JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS', 'JWT_SECRET_KEY'].includes(key)) delete env[key];
  }
  for (const id of PROVIDERS) { env[`${id.toUpperCase()}_MODEL`] = settings.models[id]; env[`${id.toUpperCase()}_API_KEY`] = settings[`${id}Key`]; }
  return { ...env, SPRING_PROFILES_ACTIVE: 'desktop', SPRING_OUTPUT_ANSI_ENABLED: 'never',
    LOCAL_DATABASE_URL: `jdbc:h2:file:${path.join(dataDirectory, 'data', 'creator-studio').replaceAll('\\', '/')};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_ON_EXIT=FALSE`,
    AI_PROVIDER: settings.provider, SCRAPER_PROVIDER: 'rapidapi', RAPIDAPI_KEY: settings.rapidApiKey,
    S3_ARCHIVE_ENABLED: 'false', SQS_WORKER_ENABLED: 'false' };
}
function canOpenExternal(value) {
  try {
    const url = new URL(value); const projectPath = '/tonyduongg/tiktok-content-intelligence';
    const isProject = url.hostname === 'github.com' && (url.pathname.toLowerCase() === projectPath || url.pathname.toLowerCase().startsWith(`${projectPath}/`));
    return url.protocol === 'https:' && !url.username && !url.password
      && (isProject || ['tiktok.com', 'aistudio.google.com', 'platform.openai.com', 'console.anthropic.com', 'platform.claude.com', 'console.x.ai', 'rapidapi.com'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)));
  } catch { return false; }
}
module.exports = { PROVIDERS, DEFAULT_SETTINGS, mergeSettings, encodeSettings, decodeSettings, backendEnvironment, canOpenExternal };
