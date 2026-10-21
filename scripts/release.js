// Copia o zip da loja (dist/) para releases/ e grava o hash SHA-256 em releases/SHA256.txt.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const name = `soft-themes-for-pinterest-${version}.zip`;
fs.mkdirSync(path.join(ROOT, 'releases'), { recursive: true });
const dest = path.join(ROOT, 'releases', name);
fs.copyFileSync(path.join(ROOT, 'dist', name), dest);
const hash = crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
fs.writeFileSync(path.join(ROOT, 'releases', 'SHA256.txt'), `${hash}  ${name}\n`);
console.log(`releases/${name}\nsha256 ${hash}`);
