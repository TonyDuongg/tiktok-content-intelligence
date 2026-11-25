const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const root = path.resolve(__dirname, '../..');
const desktop = path.join(root, 'desktop');
const runtime = path.join(desktop, '.runtime');
const cache = path.join(desktop, '.cache');

function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Build step failed (${path.basename(command)}), exit ${result.status}`);
}

function removeBuildDirectory(target) {
  const absolute = path.resolve(target);
  if (!absolute.startsWith(`${desktop}${path.sep}`) || ![cache, runtime].some((base) => absolute.startsWith(`${base}${path.sep}`))) {
    throw new Error('Refusing to remove a directory outside desktop build staging.');
  }
  fs.rmSync(absolute, { recursive: true, force: true });
}

async function prepareJava() {
  const manifest = require('../java-runtime.json');
  const archive = path.join(cache, 'temurin-jre.zip');
  const digest = () => crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  if (!fs.existsSync(archive) || digest() !== manifest.sha256) {
    console.log(`Downloading ${manifest.vendor} Java ${manifest.version}...`);
    const response = await fetch(manifest.url);
    if (!response.ok) throw new Error(`Java download failed: HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(archive));
  }
  if (digest() !== manifest.sha256) throw new Error('Java runtime checksum does not match the pinned release.');
  const marker = path.join(runtime, 'java-version.txt');
  if (fs.existsSync(path.join(runtime, 'java/bin/java.exe')) && fs.existsSync(marker)
    && fs.readFileSync(marker, 'utf8') === manifest.sha256) return;
  const extracted = path.join(cache, 'java-extracted');
  removeBuildDirectory(extracted);
  run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'expand-runtime.ps1'), '-Archive', archive, '-Destination', extracted]);
  const directory = fs.readdirSync(extracted).find((name) => fs.existsSync(path.join(extracted, name, 'bin/java.exe')));
  if (!directory) throw new Error('Java runtime archive has an unexpected layout.');
  removeBuildDirectory(path.join(runtime, 'java'));
  fs.cpSync(path.join(extracted, directory), path.join(runtime, 'java'), { recursive: true });
  fs.writeFileSync(marker, manifest.sha256);
  fs.writeFileSync(path.join(runtime, 'java/SOURCE.json'), JSON.stringify(manifest, null, 2));
}

async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This release script builds on Windows x64.');
  fs.mkdirSync(runtime, { recursive: true });
  fs.mkdirSync(cache, { recursive: true });
  const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const frontendEnv = { ...process.env, VITE_API_BASE_URL: '' };
  run(process.execPath, [path.join(__dirname, 'check-language.cjs')]);
  run(process.execPath, ['--test', ...fs.readdirSync(desktop).filter((name) => name.endsWith('.test.cjs')).map((name) => path.join(desktop, name))]);
  run(process.execPath, [npm, '--prefix', 'frontend', 'run', 'lint']);
  run(process.execPath, [npm, '--prefix', 'frontend', 'test']);
  run(process.execPath, [npm, '--prefix', 'frontend', 'run', 'build'], root, frontendEnv);
  run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'build-backend.ps1')]);
  const jar = path.join(root, 'backend/target/tiktok-content-intelligence-0.0.1-SNAPSHOT.jar');
  fs.copyFileSync(jar, path.join(runtime, 'backend.jar'));
  await prepareJava();
  require('./create-icon.cjs');
  fs.cpSync(path.join(root, 'frontend/public/fonts'), path.join(desktop, 'ui/fonts'), {
    recursive: true, filter: (source) => fs.statSync(source).isDirectory() || /(?:\.woff2|OFL\.txt)$/.test(source),
  });
  const guide = [
    'CREATOR STUDIO — WINDOWS X64', '',
    '1. Extract the entire ZIP to a folder.',
    '2. Open Creator Studio.exe. Java, Node.js, PostgreSQL and Docker are not required.',
    '3. Choose Gemini, OpenAI, Anthropic or xAI in Settings, add your key and select a model.',
    '   Add a RapidAPI key for TikTok research. No app login is required.',
    '4. Script generation and TikTok research need Internet access. Saved scripts remain on your computer.', '',
    'Data: %APPDATA%\\Creator Studio',
    'Open Settings / Data folder to find the database and logs.',
    'Close the app before backing up data. API keys are encrypted for your Windows account;',
    'when moving computers, copy only the data folder and re-enter keys in Settings.',
    'The portable app does not automatically import the web PostgreSQL library.', '',
    'Java: Eclipse Temurin 21. Licenses and notices are in resources\\java.',
    'The Windows x64 build is unsigned. macOS/Linux packages are not available.',
    'Full guide: resources\\DESKTOP.md.', '',
    'AI providers and model discovery: resources\\AI_PROVIDERS.md.', '',
  ].join('\r\n');
  fs.writeFileSync(path.join(runtime, 'README.txt'), guide, 'utf8');
  console.log('Desktop runtime prepared. Personal .env files, databases and logs were not copied.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
