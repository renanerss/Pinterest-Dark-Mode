const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AdmZip = require('adm-zip');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const ZIP = `releases/soft-themes-for-pinterest-${pkg.version}.zip`;
const RAW = `https://github.com/renanerss/Pinterest-Dark-Mode/raw/main/${ZIP}`;

for (const file of ['README.md', 'README.pt-BR.md']) {
  test(`${file}: link de download do zip, passos de instalação e imagens existentes`, () => {
    const md = read(file);
    assert.ok(md.includes(RAW), 'link raw do zip da versão atual');
    for (const k of ['chrome://extensions', 'manifest.json']) assert.ok(md.includes(k), k);
    assert.match(md, /privacy-policy\.md/);
    const imgs = [...md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('http'));
    assert.ok(imgs.length >= 2, 'pelo menos 2 imagens locais');
    for (const i of imgs) assert.ok(fs.existsSync(path.join(ROOT, i)), i);
  });
}

test('README.md e README.pt-BR.md apontam um para o outro', () => {
  assert.match(read('README.md'), /README\.pt-BR\.md/);
  assert.match(read('README.pt-BR.md'), /\(README\.md\)/);
});

test('releases: zip da versão atual existe, tem manifest.json na raiz, sem key e com a versão certa', () => {
  const z = new AdmZip(path.join(ROOT, ZIP));
  const m = JSON.parse(z.readAsText('manifest.json'));
  assert.equal(m.version, pkg.version);
  assert.equal(m.key, undefined);
  assert.ok(!z.getEntries().some((e) => /^(tests|docs|scripts|node_modules)\//.test(e.entryName)));
});

test('releases: o zip publicado é idêntico ao que o build atual gera (nada defasado)', async () => {
  const os = require('node:os');
  const { build } = require('../scripts/build.js');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-rel-'));
  const { zip } = await build({ variant: 'store', outDir: out });
  const files = (p) => new AdmZip(p).getEntries().filter((e) => !e.isDirectory).map((e) => [e.entryName, e.getData().toString('base64')]).sort();
  assert.deepEqual(files(path.join(ROOT, ZIP)), files(zip));
});
