// Gera o pacote da extensão.
//   store: dist/extension + dist/soft-themes-for-pinterest-<versão>.zip (sem "key")
//   test:  dist/test (mantém "key" e já concede <all_urls>, usado pelos e2e)
const fs = require('node:fs');
const path = require('node:path');
const AdmZip = require('adm-zip');

const ROOT = path.resolve(__dirname, '..');
const INCLUDE = ['_locales', 'src', 'css', 'popup', 'icons'];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name);
    if (e.isDirectory()) copyDir(s, path.join(to, e.name));
    else fs.copyFileSync(s, path.join(to, e.name));
  }
}

function referencedFiles(m) {
  const files = [];
  for (const cs of m.content_scripts || []) files.push(...(cs.js || []), ...(cs.css || []));
  if (m.action && m.action.default_popup) files.push(m.action.default_popup);
  if (m.background && m.background.service_worker) files.push(m.background.service_worker);
  files.push(...Object.values(m.icons || {}), ...Object.values((m.action && m.action.default_icon) || {}));
  if (m.default_locale) files.push(`_locales/${m.default_locale}/messages.json`);
  return files;
}

async function build({ variant = 'store', outDir = path.join(ROOT, 'dist') } = {}) {
  if (!['store', 'test'].includes(variant)) throw new Error(`variant inválida: ${variant}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (manifest.version !== pkg.version) throw new Error(`versão do manifest (${manifest.version}) != package.json (${pkg.version})`);

  const dir = path.join(outDir, variant === 'store' ? 'extension' : 'test');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const d of INCLUDE) if (fs.existsSync(path.join(ROOT, d))) copyDir(path.join(ROOT, d), path.join(dir, d));

  const out = { ...manifest };
  if (variant === 'store') delete out.key;
  else out.host_permissions = ['<all_urls>'];
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(out, null, 2) + '\n');

  for (const f of referencedFiles(out)) {
    if (!fs.existsSync(path.join(dir, f))) throw new Error(`arquivo referenciado no manifest não existe: ${f}`);
  }

  let zip;
  if (variant === 'store') {
    zip = path.join(outDir, `soft-themes-for-pinterest-${manifest.version}.zip`);
    const z = new AdmZip();
    z.addLocalFolder(dir);
    z.writeZip(zip);
  }
  return { dir, manifest: out, zip };
}

if (require.main === module) {
  const variant = process.argv.includes('--test') ? 'test' : 'store';
  build({ variant }).then(({ dir, zip }) => console.log(`${variant}: ${dir}${zip ? `\nzip: ${zip}` : ''}`)).catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { build };
