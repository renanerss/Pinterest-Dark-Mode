const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const SIZES = [16, 32, 48, 128];
const read = (n) => fs.readFileSync(path.join(ROOT, 'icons', `icon-${n}.png`));
const hex = (px) => '#' + px.slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('');
const at = (png, x, y) => [...png.data.slice((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];

test('os 4 ícones existem e o IHDR tem largura==altura==tamanho do nome, 8 bits, RGBA', () => {
  for (const n of SIZES) {
    const b = read(n);
    assert.equal(b.readUInt32BE(16), n, `largura ${n}`);
    assert.equal(b.readUInt32BE(20), n, `altura ${n}`);
    assert.equal(b[24], 8, 'bits');
    assert.equal(b[25], 6, 'RGBA');
  }
});

test('cada ícone não é uniforme (≥ 3 cores distintas)', () => {
  for (const n of SIZES) {
    const png = PNG.sync.read(read(n));
    const colors = new Set();
    for (let i = 0; i < png.data.length; i += 4) colors.add(png.data.slice(i, i + 4).join(','));
    assert.ok(colors.size >= 3, `${n}: ${colors.size} cores`);
  }
});

test('ícone de 128: lado esquerdo #2b2d2f, lado direito #f4ecd8, cantos transparentes', () => {
  const png = PNG.sync.read(read(128));
  assert.equal(hex(at(png, 38, 64)), '#2b2d2f');
  assert.equal(hex(at(png, 90, 64)), '#f4ecd8');
  assert.equal(at(png, 0, 0)[3], 0);
});

test('manifest.icons e action.default_icon apontam para os 4 arquivos', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  for (const n of SIZES) {
    assert.equal(m.icons[String(n)], `icons/icon-${n}.png`);
    assert.equal(m.action.default_icon[String(n)], `icons/icon-${n}.png`);
  }
});
