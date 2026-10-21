const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
// Lista oficial de locales aceitos em _locales (developer.chrome.com, conferida em 2026-10-20).
const OFFICIAL = ('ar am bg bn ca cs da de el en en_AU en_GB en_US es es_419 et fa fi fil fr gu he hi hr hu id it ja kn ko lt lv ml mr ms ' +
  'nl no pl pt_BR pt_PT ro ru sk sl sr sv sw ta te th tr uk vi zh_CN zh_TW').split(' ');

const read = (loc) => JSON.parse(fs.readFileSync(path.join(ROOT, '_locales', loc, 'messages.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

test('existem exatamente os 55 diretórios de _locales da lista oficial', () => {
  assert.equal(OFFICIAL.length, 55);
  assert.deepEqual(fs.readdirSync(path.join(ROOT, '_locales')).sort(), [...OFFICIAL].sort());
});

test('todos os idiomas têm exatamente as mesmas chaves que en; extName é igual em todos', () => {
  const keys = Object.keys(read('en')).sort();
  for (const loc of OFFICIAL) {
    const m = read(loc);
    assert.deepEqual(Object.keys(m).sort(), keys, loc);
    assert.equal(m.extName.message, read('en').extName.message, loc);
  }
});

test('toda mensagem tem "message" não vazia', () => {
  for (const loc of OFFICIAL) for (const [k, v] of Object.entries(read(loc))) assert.ok(v.message && v.message.trim(), `${loc}.${k}`);
});

test('extName ≤ 75 e extDescription ≤ 132 caracteres, nos 55 idiomas', () => {
  for (const loc of OFFICIAL) {
    const m = read(loc);
    assert.ok([...m.extName.message].length <= 75, `${loc} extName`);
    assert.ok([...m.extDescription.message].length <= 132, `${loc} extDescription (${[...m.extDescription.message].length})`);
  }
});

test('toda extDescription contém "Pinterest" (aviso de não afiliação)', () => {
  for (const loc of OFFICIAL) assert.ok(read(loc).extDescription.message.includes('Pinterest'), loc);
});

test('manifest usa __MSG_extName__ / __MSG_extDescription__ e default_locale "en"', () => {
  assert.equal(manifest.name, '__MSG_extName__');
  assert.equal(manifest.description, '__MSG_extDescription__');
  assert.equal(manifest.default_locale, 'en');
});

test('en: extName === "Soft Themes for Pinterest" e extDescription termina com "Not affiliated with Pinterest."', () => {
  assert.equal(read('en').extName.message, 'Soft Themes for Pinterest');
  assert.ok(read('en').extDescription.message.endsWith('Not affiliated with Pinterest.'));
});

test('pt_BR termina com "Sem vínculo com o Pinterest."', () => {
  assert.ok(read('pt_BR').extDescription.message.endsWith('Sem vínculo com o Pinterest.'));
});

test('todo data-i18n / data-i18n-aria do popup.html existe nas mensagens', () => {
  const html = fs.readFileSync(path.join(ROOT, 'popup/popup.html'), 'utf8');
  const used = [...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(used.length >= 6, 'popup deve usar data-i18n');
  const en = read('en');
  for (const k of used) assert.ok(en[k], k);
});
