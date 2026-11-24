const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const isAscii = (value) => /^[\x20-\x7e]+$/.test(value);
function resolveRuntimeDirectory(directory, temporaryDirectory) {
  if (isAscii(directory)) return directory;
  // Java's Windows launcher and native libraries can lose characters outside
  // the system code page. A private runtime cache avoids changing vendor binaries.
  const base = path.join(temporaryDirectory, 'creator-studio-runtime');
  if (!isAscii(base)) throw new Error('Java không hỗ trợ đường dẫn này trên cấu hình Windows hiện tại. Hãy giải nén ứng dụng vào thư mục không dấu, ví dụ D:\\CreatorStudio, rồi mở lại.');
  const hash = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(directory, 'backend.jar')))
    .update(fs.readFileSync(path.join(directory, 'java/SOURCE.json'))).digest('hex').slice(0, 20);
  const cache = path.join(base, hash);
  if (!fs.existsSync(path.join(cache, '.complete'))) {
    fs.mkdirSync(cache, { recursive: true });
    fs.cpSync(path.join(directory, 'java'), path.join(cache, 'java'), { recursive: true });
    fs.copyFileSync(path.join(directory, 'backend.jar'), path.join(cache, 'backend.jar'));
    fs.writeFileSync(path.join(cache, '.complete'), '1');
  }
  return cache;
}
module.exports = { resolveRuntimeDirectory };
