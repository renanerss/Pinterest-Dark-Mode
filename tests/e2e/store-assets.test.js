const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');
const { generate } = require('../../scripts/store-assets');

const dims = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const colors = (f) => { const p = PNG.sync.read(fs.readFileSync(f)); const s = new Set(); for (let i = 0; i < p.data.length; i += 4 * 97) s.add(p.data.slice(i, i + 3).join(',')); return s.size; };

test('materiais offline: promo 440x280 e screenshot do popup 1280x800, não vazios', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-store-'));
  await generate({ outDir: out, live: false });
  expect(dims(path.join(out, 'promo-small.png'))).toEqual([440, 280]);
  expect(dims(path.join(out, 'screenshot-popup.png'))).toEqual([1280, 800]);
  expect(colors(path.join(out, 'promo-small.png'))).toBeGreaterThan(3);
  expect(colors(path.join(out, 'screenshot-popup.png'))).toBeGreaterThan(5);
});

test('materiais ao vivo: 3 capturas do Pinterest em 1280x800', async () => {
  test.skip(!process.env.PT_LIVE, 'defina PT_LIVE=1 (requer rede)');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-store-live-'));
  await generate({ outDir: out, live: true });
  for (const t of ['light', 'dark', 'sepia']) expect(dims(path.join(out, `screenshot-pinterest-${t}.png`))).toEqual([1280, 800]);
});
