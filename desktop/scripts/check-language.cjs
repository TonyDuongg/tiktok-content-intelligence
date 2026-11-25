const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const vietnamese = /[ĂăĐđƠơƯư\u1ea0-\u1ef9]/u;
const failures = [];
function scan(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) { scan(name); continue; }
    if (!/\.(?:md|java|jsx?|cjs|html)$/.test(name) || /\.test\.|(?:MockTikTokScraperClient\.java|check-language\.cjs)$/.test(name)) continue;
    let text = fs.readFileSync(path.join(root, name), 'utf8');
    // These are compatibility rules for existing multilingual data, not UI copy.
    if (name === 'frontend/src/studio.js') text = text.replace(/const LEGACY_TONES = \{[\s\S]*?\};/, '');
    if (name === 'frontend/src/components.jsx') text = text.replace('Tip|Step|Method|Cách|Bước|Mẹo', '');
    if (name.endsWith('/ChannelInsightsService.java')) text = text.replace(".replace('đ', 'd').replace('Đ', 'D')", '');
    text.split('\n').forEach((line, index) => {
      if (vietnamese.test(line)) failures.push(`${name}:${index + 1}`);
    });
  }
}
for (const directory of ['frontend/src', 'desktop/ui', 'desktop/scripts', 'backend/src/main/java', 'docs']) scan(directory);
for (const name of ['README.md', 'CONTRIBUTING.md', 'frontend/index.html', 'desktop/main.cjs', 'desktop/lib.cjs', 'desktop/windows-runtime.cjs']) {
  if (vietnamese.test(fs.readFileSync(path.join(root, name), 'utf8'))) failures.push(name);
}
if (failures.length) {
  console.error(`Translate product-authored Vietnamese copy to English:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log('English copy check passed; multilingual user/source fixtures and compatibility rules are preserved.');
