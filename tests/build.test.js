const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const AdmZip = require('adm-zip');
const { build } = require('../scripts/build.js');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pt-build-'));

function referencedFiles(m) {
  const files = [];
  for (const cs of m.content_scripts || []) files.push(...(cs.js || []), ...(cs.css || []));
  if (m.action && m.action.default_popup) files.push(m.action.default_popup);
  if (m.background && m.background.service_worker) files.push(m.background.service_worker);
  files.push(...Object.values(m.icons || {}), ...Object.values((m.action && m.action.default_icon) || {}));
  files.push(`_locales/${m.default_locale}/messages.json`);
  return files;
}

function listAll(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listAll(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')]);
}

test('store: manifest sem "key"; versão == package.json', async () => {
  const { manifest } = await build({ variant: 'store', outDir: tmp() });
  assert.equal(manifest.key, undefined);
  assert.equal(manifest.version, pkg.version);
});

test('store: sem host_permissions; permissions == ["storage","scripting"]', async () => {
  const { manifest } = await build({ variant: 'store', outDir: tmp() });
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.permissions, ['storage', 'scripting']);
  assert.deepEqual(manifest.optional_host_permissions, ['<all_urls>']);
});

test('store: todo arquivo referenciado existe no pacote', async () => {
  const { dir, manifest } = await build({ variant: 'store', outDir: tmp() });
  for (const f of referencedFiles(manifest)) assert.ok(fs.existsSync(path.join(dir, f)), f);
});

test('store: pacote não contém arquivos de desenvolvimento', async () => {
  const { dir } = await build({ variant: 'store', outDir: tmp() });
  const all = listAll(dir);
  for (const f of all) assert.ok(!/^(tests|docs|scripts|node_modules|dist|\.git)\//.test(f) && !/^\.|package|playwright|ledger/i.test(f), f);
  assert.ok(all.includes('manifest.json'));
});

test('store: o zip abre e tem manifest.json na raiz', async () => {
  const out = tmp();
  await build({ variant: 'store', outDir: out });
  const zipPath = path.join(out, `soft-themes-for-pinterest-${pkg.version}.zip`);
  assert.ok(fs.existsSync(zipPath));
  const names = new AdmZip(zipPath).getEntries().map((e) => e.entryName);
  assert.ok(names.includes('manifest.json'));
  assert.ok(!names.some((n) => n.startsWith('tests/') || n.startsWith('docs/')));
});

test('test: mantém "key" e tem host_permissions ["<all_urls>"]', async () => {
  const { manifest } = await build({ variant: 'test', outDir: tmp() });
  assert.ok(manifest.key);
  assert.deepEqual(manifest.host_permissions, ['<all_urls>']);
});
