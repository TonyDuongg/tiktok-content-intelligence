const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_SETTINGS, mergeSettings, encodeSettings, decodeSettings, backendEnvironment, canOpenExternal } = require('./lib.cjs');
const crypto = {
  isAsyncEncryptionAvailable: async () => true,
  encryptStringAsync: async (value) => Buffer.from([...value].reverse().join('')),
  decryptStringAsync: async (value) => ({ result: [...value.toString()].reverse().join('') }),
};

test('blank inputs preserve saved keys; explicit removal and replacement work', () => {
  const saved = { ...DEFAULT_SETTINGS, geminiKey: 'old-gemini', rapidApiKey: 'old-rapid' };
  assert.deepEqual(mergeSettings({ geminiKey: ' ', rapidApiKey: '' }, saved), saved);
  assert.deepEqual(mergeSettings({ geminiKey: ' new ', clearRapidApi: true, arbitrary: 'ignored' }, saved), {
    ...saved, geminiKey: 'new', rapidApiKey: '',
  });
  assert.throws(() => mergeSettings({ model: 'a\n--flag' }));
  assert.throws(() => mergeSettings({ geminiKey: 'key\nINJECT=value' }));
  assert.throws(() => mergeSettings({ rapidApiKey: { value: 'key' } }));
});

test('settings storage contains encrypted values and requires available OS encryption', async () => {
  const settings = { ...DEFAULT_SETTINGS, geminiKey: 'test-gemini-secret', rapidApiKey: 'test-rapid-secret' };
  const record = await encodeSettings(settings, crypto);
  assert.equal(JSON.stringify(record).includes(settings.geminiKey), false);
  assert.equal(JSON.stringify(record).includes(settings.rapidApiKey), false);
  assert.deepEqual(await decodeSettings(record, crypto), settings);
  await assert.rejects(() => encodeSettings(settings, { isAsyncEncryptionAvailable: async () => false }));
  await assert.doesNotReject(() => encodeSettings(DEFAULT_SETTINGS, { isAsyncEncryptionAvailable: async () => false }));
  await assert.rejects(() => decodeSettings({ version: 3 }, crypto));
});

test('desktop isolates the database, provider keys and Java options from developer environment', () => {
  const env = backendEnvironment({ PATH: 'system-path', SPRING_DATASOURCE_URL: 'private-db',
    SPRING_APPLICATION_JSON: '{"secret":"value"}', GEMINI_API_KEY: 'developer-key',
    RAPIDAPI_KEY: 'developer-rapid', OPENAI_API_KEY: 'private-openai', ANTHROPIC_API_KEY: 'private-claude', XAI_API_KEY: 'private-grok', AWS_SECRET_ACCESS_KEY: 'private-aws', JAVA_TOOL_OPTIONS: '-agentlib:debug',
  }, DEFAULT_SETTINGS, 'C:\\Users\\Other Person\\AppData\\Roaming\\Creator Studio');
  assert.equal(env.PATH, 'system-path');
  assert.equal(env.SPRING_DATASOURCE_URL, undefined);
  assert.equal(env.SPRING_APPLICATION_JSON, undefined);
  assert.equal(env.AWS_SECRET_ACCESS_KEY, undefined);
  assert.equal(env.JAVA_TOOL_OPTIONS, undefined);
  assert.equal(env.GEMINI_API_KEY, '');
  assert.equal(env.RAPIDAPI_KEY, '');
  for (const name of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'XAI_API_KEY']) assert.equal(env[name], '');
  assert.match(env.LOCAL_DATABASE_URL, /^jdbc:h2:file:C:\/Users\/Other Person/);
  assert.equal(env.SPRING_PROFILES_ACTIVE, 'desktop');
});

test('external links allow only HTTPS on known provider hosts', () => {
  for (const url of ['https://www.tiktok.com/@creator/video/123', 'https://aistudio.google.com/api-keys', 'https://rapidapi.com/',
    'https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest']) assert.equal(canOpenExternal(url), true);
  for (const url of ['https://github.com/someone/another-project', 'https://github.com/TonyDuongg/tiktok-content-intelligence-copy']) assert.equal(canOpenExternal(url), false);
  for (const url of ['file:///C:/Windows/cmd.exe', 'javascript:alert(1)', 'https://tiktok.com.attacker.example',
    'https://attacker.example/?next=tiktok.com', 'https://user:pass@tiktok.com/', 'http://rapidapi.com/']) assert.equal(canOpenExternal(url), false); // agent-redact-ignore: deliberately invalid authentication URL fixture
});

test('provider keys and models survive switching and legacy encrypted settings migrate', async () => {
  const legacy = { version: 1, model: 'gemini-legacy', gemini: Buffer.from('yek-dlo').toString('base64'), rapidApi: '' };
  const migrated = await decodeSettings(legacy, crypto);
  assert.equal(migrated.provider, 'gemini'); assert.equal(migrated.geminiKey, 'old-key'); assert.equal(migrated.models.gemini, 'gemini-legacy');
  const openai = mergeSettings({ provider: 'openai', openaiKey: 'gpt-test-key', models: { openai: 'gpt-test' } }, migrated);
  const claude = mergeSettings({ provider: 'anthropic', anthropicKey: 'claude-test-key', models: { anthropic: 'claude-test' } }, openai);
  const decoded = await decodeSettings(await encodeSettings(claude, crypto), crypto);
  assert.deepEqual(decoded, claude); assert.equal(decoded.openaiKey, 'gpt-test-key'); assert.equal(decoded.geminiKey, 'old-key');
  const cleared = mergeSettings({ clearOpenai: true }, decoded);
  assert.equal(cleared.openaiKey, ''); assert.equal(cleared.anthropicKey, 'claude-test-key');
  assert.throws(() => mergeSettings({ provider: 'https://evil.example' }));
  const env = backendEnvironment({ OPENAI_API_KEY: 'developer-secret' }, openai, 'C:/Test');
  assert.equal(env.AI_PROVIDER, 'openai'); assert.equal(env.OPENAI_API_KEY, 'gpt-test-key'); assert.equal(env.OPENAI_MODEL, 'gpt-test');
});
