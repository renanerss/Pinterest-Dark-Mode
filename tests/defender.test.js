const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseScanOutput } = require('../scripts/defender-scan.js');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const ZIP = `releases/soft-themes-for-pinterest-${pkg.version}.zip`;

test('parseScanOutput: "found N threats" => N', () => {
  assert.equal(parseScanOutput('Scanning x found 1 threats.\nThreat : Trojan:Script/Ulthar.A!ml'), 1);
  assert.equal(parseScanOutput('Scanning x found 3 threats.'), 3);
});
test('parseScanOutput: "found no threats" => 0', () => {
  assert.equal(parseScanOutput('Scanning x found no threats.'), 0);
});
test('parseScanOutput: saída desconhecida => erro (não assume limpo)', () => {
  assert.throws(() => parseScanOutput('algo inesperado'), /inesperada/i);
});

test('releases/SHA256.txt contém o hash do zip publicado', () => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, ZIP))).digest('hex');
  assert.equal(read('releases/SHA256.txt').trim(), `${hash}  soft-themes-for-pinterest-${pkg.version}.zip`);
});

for (const f of ['README.md', 'README.pt-BR.md']) {
  test(`${f}: orienta sobre falso positivo do Windows Defender sem pedir para desativá-lo`, () => {
    const md = read(f);
    assert.match(md, /Defender/);
    assert.match(md, /SHA256\.txt/);
    assert.match(md, /wdsi\/filesubmission/);
    assert.ok(!/(desativ|disable|turn off|exclu[ií]r?|exclusion)[^.\n]{0,40}(antiv|defender|antivirus)/i.test(md), 'não deve recomendar desligar o antivírus');
  });
}
