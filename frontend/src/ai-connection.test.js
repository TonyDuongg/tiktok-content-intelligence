import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAiChoice, saveAiChoice, aiReady } from './ai-connection.js';

test('only provider and model preferences persist; API keys never enter browser storage', () => {
  let stored;
  const storage = { setItem: (_key, value) => { stored = value; }, getItem: () => stored };
  const config = { provider: 'openai', models: { openai: 'gpt-test' }, keys: { openai: 'private-key' }, serverConfigured: {} };
  saveAiChoice(config, storage);
  assert.equal(stored.includes('private-key'), false);
  assert.deepEqual(readAiChoice(storage).keys, {});
  assert.equal(readAiChoice(storage).models.openai, 'gpt-test');
  assert.equal(aiReady(config, {}), true);
  assert.equal(aiReady(readAiChoice(storage), { aiConfigured: true, aiProvider: 'gemini' }), false);
  assert.equal(aiReady({ ...config, keys: {}, serverConfigured: { openai: true } }, {}), true);
});

test('bad preferences and blocked storage do not prevent startup', () => {
  assert.equal(readAiChoice({ getItem: () => '{bad' }).provider, '');
  assert.equal(readAiChoice({ getItem: () => { throw new Error('blocked'); } }).provider, '');
  assert.equal(readAiChoice({ getItem: () => '{"provider":"evil","models":{"openai":123}}' }).provider, '');
});
