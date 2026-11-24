const path = require('node:path');

const DEFAULT_SETTINGS = Object.freeze({ model: 'gemini-3.5-flash', geminiKey: '', rapidApiKey: '' });

function mergeSettings(input, previous = DEFAULT_SETTINGS) {
  if (!input || typeof input !== 'object') throw new Error('Cấu hình không hợp lệ.');
  const model = typeof input.model === 'string' ? input.model.trim() : previous.model;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(model)) throw new Error('Tên model Gemini chưa hợp lệ.');
  const result = { model };
  for (const [field, clear] of [['geminiKey', 'clearGemini'], ['rapidApiKey', 'clearRapidApi']]) {
    const value = input[field] ?? '';
    if (typeof value !== 'string' || /[\r\n\0]/.test(value) || value.length > 4096) {
      throw new Error('Khóa API không hợp lệ. Kiểm tra và nhập lại.');
    }
    result[field] = input[clear] === true ? '' : value.trim() || previous[field];
  }
  return result;
}

async function encodeSettings(settings, crypto) {
  if ((settings.geminiKey || settings.rapidApiKey) && !await crypto.isAsyncEncryptionAvailable()) {
    throw new Error('Windows chưa sẵn sàng lưu khóa được mã hóa. Hãy thử mở lại ứng dụng.');
  }
  const encrypt = async (value) => value ? (await crypto.encryptStringAsync(value)).toString('base64') : '';
  return { version: 1, model: settings.model, gemini: await encrypt(settings.geminiKey), rapidApi: await encrypt(settings.rapidApiKey) };
}

async function decodeSettings(record, crypto) {
  if (record.version !== 1) throw new Error('Định dạng cấu hình không được hỗ trợ.');
  const decrypt = async (value) => value ? (await crypto.decryptStringAsync(Buffer.from(value, 'base64'))).result : '';
  return mergeSettings({ model: record.model, geminiKey: await decrypt(record.gemini), rapidApiKey: await decrypt(record.rapidApi) });
}

function backendEnvironment(base, settings, dataDirectory) {
  const env = { ...base };
  for (const key of Object.keys(env)) {
    if (/^(SPRING_|APPLICATION_|AWS_|AI_|GEMINI_|RAPIDAPI_|SCRAPER_|VITE_|SERVER_|MANAGEMENT_|LOGGING_)/.test(key)
      || ['DEBUG', 'TRACE', 'LOCAL_DATABASE_URL', 'S3_ARCHIVE_ENABLED', 'SQS_WORKER_ENABLED', 'JAVA_HOME', 'JRE_HOME', 'CLASSPATH', 'JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS', 'JWT_SECRET_KEY'].includes(key)) delete env[key];
  }
  return {
    ...env, SPRING_PROFILES_ACTIVE: 'desktop', SPRING_OUTPUT_ANSI_ENABLED: 'never',
    LOCAL_DATABASE_URL: `jdbc:h2:file:${path.join(dataDirectory, 'data', 'creator-studio').replaceAll('\\', '/')};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_ON_EXIT=FALSE`,
    AI_PROVIDER: 'gemini', SCRAPER_PROVIDER: 'rapidapi', GEMINI_MODEL: settings.model,
    GEMINI_API_KEY: settings.geminiKey, RAPIDAPI_KEY: settings.rapidApiKey,
    S3_ARCHIVE_ENABLED: 'false', SQS_WORKER_ENABLED: 'false',
  };
}

function canOpenExternal(value) {
  try {
    const url = new URL(value);
    const projectPath = '/tonyduongg/tiktok-content-intelligence';
    const isProject = url.hostname === 'github.com' && (url.pathname.toLowerCase() === projectPath || url.pathname.toLowerCase().startsWith(`${projectPath}/`));
    return url.protocol === 'https:' && !url.username && !url.password
      && (isProject || ['tiktok.com', 'aistudio.google.com', 'rapidapi.com'].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)));
  } catch { return false; }
}

module.exports = { DEFAULT_SETTINGS, mergeSettings, encodeSettings, decodeSettings, backendEnvironment, canOpenExternal };
