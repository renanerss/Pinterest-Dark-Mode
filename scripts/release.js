// Copia o zip da loja (dist/) para releases/, onde o README aponta para download.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const name = `soft-themes-for-pinterest-${version}.zip`;
fs.mkdirSync(path.join(ROOT, 'releases'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'dist', name), path.join(ROOT, 'releases', name));
console.log(`releases/${name}`);
