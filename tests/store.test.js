const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const msg = (loc, key) => JSON.parse(read(`_locales/${loc}/messages.json`))[key].message;
const section = (md, title) => {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${title}`);
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
};

for (const [file, loc] of [['listing.en.md', 'en'], ['listing.pt-BR.md', 'pt_BR']]) {
  test(`${file}: seções Name, Short description, Description, Category, Single purpose`, () => {
    const md = read(`docs/store/${file}`);
    for (const s of ['Name', 'Short description', 'Description', 'Category', 'Single purpose']) assert.ok(section(md, s), `${file}: falta "${s}"`);
    assert.ok(section(md, 'Description').length > 200, 'descrição detalhada curta demais');
  });
  test(`${file}: Name e Short description iguais ao manifest (${loc}) e ≤ limites`, () => {
    const md = read(`docs/store/${file}`);
    assert.equal(section(md, 'Name'), msg(loc, 'extName'));
    assert.equal(section(md, 'Short description'), msg(loc, 'extDescription'));
    assert.ok([...section(md, 'Short description')].length <= 132);
  });
}

test('listing: descrição cita não afiliação ao Pinterest', () => {
  assert.match(read('docs/store/listing.en.md'), /Not affiliated with, endorsed by or sponsored by Pinterest/);
  assert.match(read('docs/store/listing.pt-BR.md'), /Sem v[ií]nculo, aprovação ou patrocínio do Pinterest/);
});

test('permissions.md cita storage, scripting, optional_host_permissions e os domínios estáticos', () => {
  const md = read('docs/store/permissions.md');
  for (const k of ['`storage`', '`scripting`', '`optional_host_permissions`', 'pinterest.com', 'pinterest.co.uk']) assert.ok(md.includes(k), k);
});

test('privacy-policy.md: nenhum dado coletado/transmitido e chrome.storage.sync, em en e pt-BR', () => {
  const md = read('docs/store/privacy-policy.md');
  assert.match(md, /does not collect/i);
  assert.match(md, /não coleta/i);
  assert.equal((md.match(/chrome\.storage\.sync/g) || []).length >= 2, true);
  assert.match(md, /github\.com\/renanerss\/Pinterest-Dark-Mode\/issues/);
});

test('SUBMISSION.md lista os passos manuais', () => {
  const md = read('docs/store/SUBMISSION.md');
  for (const k of ['conta de desenvolvedor', 'zip', 'política de privacidade', 'Privacy practices', 'enviar para revisão', 'permissão']) assert.ok(md.toLowerCase().includes(k.toLowerCase()), k);
});

test('CHANGELOG.md tem a entrada 1.0.0', () => {
  assert.match(read('CHANGELOG.md'), /^## 1\.0\.0/m);
});
