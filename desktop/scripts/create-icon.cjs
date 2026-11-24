// Render the repository's simple film mark into PNG/ICO without a platform image dependency.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const size = 256;
const pixels = Buffer.alloc((size * 4 + 1) * size);
function color(x, y) {
  const cornerX = Math.max(10 - x, 0, x - 30);
  const cornerY = Math.max(10 - y, 0, y - 30);
  if (cornerX * cornerX + cornerY * cornerY > 100) return [0, 0, 0, 0];
  const frame = x >= 10 && x <= 30 && y >= 8 && y <= 32
    && !(x > 12 && x < 28 && y > 10 && y < 30);
  const rails = (Math.abs(x - 16) <= 1 || Math.abs(x - 24) <= 1) && y >= 9 && y <= 31;
  const holes = (Math.abs(y - 15) <= 1 || Math.abs(y - 25) <= 1) && ((x >= 11 && x <= 16) || (x >= 24 && x <= 29));
  const middle = Math.abs(y - 20) <= 1 && x >= 16 && x <= 24;
  return frame || rails || holes || middle ? [255, 255, 255, 255] : [32, 36, 44, 255];
}
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const totals = [0, 0, 0, 0];
  for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
    const value = color((x + (sx + 0.5) / 4) / size * 40, (y + (sy + 0.5) / 4) / size * 40);
    value.forEach((v, i) => { totals[i] += v; });
  }
  totals.forEach((v, i) => { pixels[y * (size * 4 + 1) + 1 + x * 4 + i] = Math.round(v / 16); });
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) { crc ^= value; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length); name.copy(result, 4); data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), result.length - 4);
  return result;
}
const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
const resources = path.resolve(__dirname, '../resources'); fs.mkdirSync(resources, { recursive: true });
fs.writeFileSync(path.join(resources, 'icon.png'), png); fs.writeFileSync(path.join(resources, 'icon.ico'), Buffer.concat([ico, png]));
