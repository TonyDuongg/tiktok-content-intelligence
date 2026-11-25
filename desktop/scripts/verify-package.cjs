const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

async function main() {
  const { listPackage, statFile, extractFile } = await import('@electron/asar');
  const root = path.resolve(__dirname, '../..');
  const unpacked = path.resolve(process.argv[2] || path.join(root, 'release/win-unpacked'));
  const asar = path.join(unpacked, 'resources/app.asar');
  const entries = listPackage(asar).map((name) => name.replaceAll('\\', '/').replace(/^\//, ''));
  const forbidden = /(?:^|\/)(?:\.env(?:\..*)?|settings\.json|logs|node_modules|\.git)(?:\/|$)|\.mv\.db$/i;
  assert.equal(entries.some((name) => forbidden.test(name)), false, 'Unexpected private/development files in app.asar');
  for (const name of ['desktop/main.cjs', 'desktop/lib.cjs', 'desktop/windows-runtime.cjs', 'desktop/preload.cjs',
    'desktop/ui/preferences.html', 'desktop/ui/fonts/OFL.txt']) assert.ok(entries.includes(name), `Missing ${name}`);
  for (const name of ['Creator Studio.exe', 'resources/backend.jar', 'resources/java/bin/java.exe',
    'resources/java/legal/java.base/LICENSE', 'HUONG-DAN.txt', 'resources/HUONG-DAN.md', 'resources/RESEARCH.md', 'LICENSE.txt', 'THIRD-PARTY-NOTICES.md']) {
    assert.ok(fs.existsSync(path.join(unpacked, name)), `Missing ${name}`);
  }
  assert.match(fs.readFileSync(path.join(unpacked, 'LICENSE.txt'), 'utf8'), /Copyright \(c\) 2026 TonyDuongg/);
  const secrets = fs.existsSync(path.join(root, '.env'))
    ? [...fs.readFileSync(path.join(root, '.env'), 'utf8').matchAll(/^(?:GEMINI_API_KEY|RAPIDAPI_KEY)\s*=\s*(.+)$/gm)]
      .map((match) => match[1].trim().replace(/^["']|["']$/g, '')).filter((value) => value.length > 8)
    : [];
  for (const name of entries) {
    const nativeName = path.normalize(name);
    if (statFile(asar, nativeName).files) continue;
    const content = extractFile(asar, nativeName);
    assert.equal(secrets.some((secret) => content.includes(Buffer.from(secret))), false, `Private key found in ${name}`);
  }
  const java = JSON.parse(fs.readFileSync(path.join(unpacked, 'resources/java/SOURCE.json'), 'utf8'));
  assert.equal(java.sha256, require('../java-runtime.json').sha256);
  console.log(JSON.stringify({ verified: true, appEntries: entries.length, bundledJava: java.vendor,
    privateFilesExcluded: true, developerKeysExcluded: true }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
