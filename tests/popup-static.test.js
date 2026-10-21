const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Contexto: o Microsoft Defender sinalizou popup.html e popup.js como "Trojan:Script/Ulthar.A!ml" (falso positivo
// de heurística por aprendizado de máquina) ao baixar o zip. Mantemos os dois arquivos simples para ficar longe do limite.
test('popup.html não usa estilos inline nem handlers inline (cores ficam no CSS)', () => {
  const html = read('popup/popup.html');
  assert.ok(!/\sstyle=/i.test(html), 'atributo style inline');
  assert.ok(!/\son[a-z]+=/i.test(html), 'handler inline (onclick etc.)');
});

test('as cores das amostras de tema estão no popup.css', () => {
  const css = read('popup/popup.css');
  for (const [cls, color] of [['light', '#ffffff'], ['dark', '#2e2e2e'], ['sepia', '#f4ecd8']]) {
    assert.match(css, new RegExp(String.raw`\.swatch\.${cls}\s*\{[^}]*${color}`, 'i'), cls);
  }
});

test('popup.html e popup.js são ASCII puro (acentos só nos arquivos de idioma)', () => {
  for (const f of ['popup/popup.html', 'popup/popup.js']) {
    const bad = [...read(f)].filter((c) => c.charCodeAt(0) > 127);
    assert.deepEqual(bad, [], f);
  }
});

test('popup.js não usa eval, Function(), document.write nem innerHTML', () => {
  const js = read('popup/popup.js');
  for (const re of [/\beval\s*\(/, /\bnew Function\b/, /document\.write/, /innerHTML/]) assert.ok(!re.test(js), String(re));
});
