const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { backendEnvironment, DEFAULT_SETTINGS } = require('../lib.cjs');
const { resolveRuntimeDirectory } = require('../windows-runtime.cjs');

async function main() {
  if (!process.argv[2]) throw new Error('Pass the extracted application folder.');
  const runtime = resolveRuntimeDirectory(path.resolve(process.argv[2], 'resources'), require('node:os').tmpdir());
  const data = path.resolve(process.argv[3] || 'tmp/desktop-backend-smoke');
  fs.mkdirSync(path.join(data, 'data'), { recursive: true });
  const port = await new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)); });
  });
  const origin = `http://127.0.0.1:${port}`;
  const isolatedEnvironment = { ...process.env };
  for (const key of Object.keys(isolatedEnvironment)) if (key.toUpperCase() === 'PATH') delete isolatedEnvironment[key];
  isolatedEnvironment.PATH = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32');
  const child = spawn(path.join(runtime, 'java/bin/java.exe'), ['-Xmx512m', '-jar', 'backend.jar',
    `--server.port=${port}`, '--spring.config.import=', `--application.desktop.origin=${origin}`], {
    cwd: runtime, env: backendEnvironment(isolatedEnvironment, DEFAULT_SETTINGS, data), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = fs.createWriteStream(path.join(data, 'smoke.log'));
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  let launchError;
  child.on('error', (error) => { launchError = error; });
  const exited = new Promise((resolve) => child.once('close', (code) => { log.end(); resolve(code); }));
  try {
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      if (launchError) throw launchError;
      if (child.exitCode !== null) throw new Error(`Java exited ${child.exitCode}; inspect ${data}/smoke.log`);
      try { ready = (await fetch(`${origin}/actuator/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Starting. */ }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    assert.ok(ready, 'Backend startup timed out');
    const get = async (route) => (await (await fetch(origin + route)).json()).data;
    const status = await get('/api/v1/workspace/status');
    assert.equal(status.aiConfigured, false); assert.equal(status.scraperConfigured, false);
    assert.equal((await get('/api/v1/categories')).length, 5);
    assert.equal((await get('/api/v1/scripts/my-scripts')).length, 0);
    assert.match(await (await fetch(origin)).text(), /Creator Studio/);
    assert.equal((await fetch(`${origin}/api/v1/categories`, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    await fetch(`${origin}/actuator/shutdown`, { method: 'POST' });
    let timer;
    const code = await Promise.race([exited, new Promise((resolve) => { timer = setTimeout(() => resolve(-1), 12000); })]);
    clearTimeout(timer);
    assert.equal(code, 0, 'Graceful shutdown failed');
    assert.ok(fs.existsSync(path.join(data, 'data/creator-studio.mv.db')));
    console.log(JSON.stringify({ passed: true, bundledJava: true, staticFrontend: true, realMode: true,
      emptyLibrary: true, isolatedKeys: true, corsRestricted: true, gracefulShutdown: true }));
  } finally {
    if (child.exitCode === null && !child.signalCode) child.kill();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
