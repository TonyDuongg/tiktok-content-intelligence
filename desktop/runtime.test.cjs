const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveRuntimeDirectory } = require('./windows-runtime.cjs');

test('ASCII installation paths run in place without a runtime cache', () => {
  assert.equal(resolveRuntimeDirectory('D:\\CreatorStudio\\resources', 'unused'), 'D:\\CreatorStudio\\resources');
});

test('Unicode installations cache only Java and backend, without settings or personal data', (context) => {
  if (!/^[\x20-\x7e]+$/.test(os.tmpdir())) { context.skip('This fixture needs an ASCII temporary path'); return; }
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'creator-runtime-test-'));
  try {
    const source = path.join(fixture, 'ứng dụng', 'resources');
    fs.mkdirSync(path.join(source, 'java/bin'), { recursive: true });
    fs.writeFileSync(path.join(source, 'java/bin/java.exe'), 'runtime-fixture');
    fs.writeFileSync(path.join(source, 'java/SOURCE.json'), '{}');
    fs.writeFileSync(path.join(source, 'backend.jar'), 'backend-fixture');
    fs.writeFileSync(path.join(source, 'settings.json'), 'private-fixture');
    const destination = resolveRuntimeDirectory(source, path.join(fixture, 'cache'));
    assert.match(destination, /^[\x20-\x7e]+$/);
    assert.equal(fs.readFileSync(path.join(destination, 'backend.jar'), 'utf8'), 'backend-fixture');
    assert.ok(fs.existsSync(path.join(destination, 'java/bin/java.exe')));
    assert.equal(fs.existsSync(path.join(destination, 'settings.json')), false);
    assert.equal(resolveRuntimeDirectory(source, path.join(fixture, 'cache')), destination);
    assert.throws(() => resolveRuntimeDirectory(source, path.join(fixture, 'bộ đệm')), /không dấu/);
  } finally {
    const resolved = path.resolve(fixture);
    assert.ok(resolved.startsWith(`${path.resolve(os.tmpdir())}${path.sep}creator-runtime-test-`));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
