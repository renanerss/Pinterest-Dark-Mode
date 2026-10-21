// Gera icons/icon-{16,32,48,128}.png sem dependências (PNG RGBA via zlib).
// Desenho: quadrado arredondado, metade esquerda #2b2d2f e direita #f4ecd8, borda #d9dadb de 1/16 do lado.
// Sem o logotipo do Pinterest e sem o vermelho da marca.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DARK = [0x2b, 0x2d, 0x2f];
const SEPIA = [0xf4, 0xec, 0xd8];
const BORDER = [0xd9, 0xda, 0xdb];
const SS = 4; // supersampling por eixo

function insideRoundedRect(x, y, size, inset, radius) {
  const lo = inset, hi = size - inset;
  if (x < lo || x > hi || y < lo || y > hi) return false;
  const cx = x < lo + radius ? lo + radius : x > hi - radius ? hi - radius : x;
  const cy = y < lo + radius ? lo + radius : y > hi - radius ? hi - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function render(size) {
  const radius = size * 0.22;
  const border = Math.max(1, size / 16);
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS, y = py + (sy + 0.5) / SS;
          if (!insideRoundedRect(x, y, size, 0, radius)) continue;
          const c = insideRoundedRect(x, y, size, border, Math.max(0, radius - border)) ? (x < size / 2 ? DARK : SEPIA) : BORDER;
          r += c[0]; g += c[1]; b += c[2]; a += 1;
        }
      }
      const o = (py * size + px) * 4;
      if (a) { rgba[o] = Math.round(r / a); rgba[o + 1] = Math.round(g / a); rgba[o + 2] = Math.round(b / a); }
      rgba[o + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return rgba;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.resolve(__dirname, '../icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), encodePng(size, render(size)));
  console.log(`icons/icon-${size}.png`);
}
