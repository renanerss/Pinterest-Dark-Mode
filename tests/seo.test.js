const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SITE = 'https://renanerss.github.io/Pinterest-Dark-Mode/';
const PAGES = [
  { file: 'docs/index.html', lang: 'en', url: SITE, kw: /pinterest dark mode/i },
  { file: 'docs/pt-br/index.html', lang: 'pt-BR', url: SITE + 'pt-br/', kw: /modo escuro (do|para o) pinterest/i },
];
const meta = (html, attr, name) => {
  const m = html.match(new RegExp(`<meta[^>]+${attr}="${name}"[^>]+content="([^"]*)"`, 'i'));
  return m ? m[1] : null;
};

for (const p of PAGES) {
  const html = () => read(p.file);

  test(`${p.file}: lang, title, description e h1 únicos com a palavra-chave`, () => {
    const h = html();
    assert.match(h, new RegExp(`<html[^>]+lang="${p.lang}"`));
    const title = h.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(title.length >= 30 && title.length <= 65, `title ${title.length}: ${title}`);
    assert.match(title, p.kw);
    const d = meta(h, 'name', 'description');
    assert.ok(d && d.length >= 70 && d.length <= 160, `description ${d && d.length}`);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, 'exatamente um h1');
    assert.match(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1], p.kw);
  });

  test(`${p.file}: canonical, hreflang, Open Graph e Twitter Card`, () => {
    const h = html();
    assert.ok(h.includes(`<link rel="canonical" href="${p.url}">`));
    for (const [hl, href] of [['en', SITE], ['pt-BR', SITE + 'pt-br/'], ['x-default', SITE]]) {
      assert.ok(h.includes(`<link rel="alternate" hreflang="${hl}" href="${href}">`), `hreflang ${hl}`);
    }
    assert.equal(meta(h, 'property', 'og:url'), p.url);
    assert.ok(meta(h, 'property', 'og:title') && meta(h, 'property', 'og:description'));
    assert.equal(meta(h, 'property', 'og:image'), SITE + 'images/og-image.png');
    assert.equal(meta(h, 'name', 'twitter:card'), 'summary_large_image');
    assert.ok(meta(h, 'name', 'viewport'));
  });

  test(`${p.file}: JSON-LD SoftwareApplication válido`, () => {
    const m = html().match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, 'JSON-LD presente');
    const j = JSON.parse(m[1]);
    assert.equal(j['@type'], 'SoftwareApplication');
    assert.equal(j.applicationCategory, 'BrowserApplication');
    assert.equal(j.offers.price, '0');
    assert.equal(j.inLanguage, p.lang);
    assert.ok(j.downloadUrl.endsWith('.zip'));
    assert.equal(j.url, p.url);
  });

  test(`${p.file}: imagens com alt, links locais existem, link de download do zip e sem JS`, () => {
    const h = html();
    for (const img of h.match(/<img\b[^>]*>/g) || []) assert.match(img, /\balt="[^"]+"/, img);
    assert.ok(h.includes('raw/main/releases/soft-themes-for-pinterest-'));
    assert.ok(!/<script(?![^>]*ld\+json)/.test(h), 'sem scripts além do JSON-LD');
    const dir = path.dirname(path.join(ROOT, p.file));
    for (const ref of [...h.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('http') && !u.startsWith('mailto'))) {
      assert.ok(fs.existsSync(path.resolve(dir, ref)), `${p.file} -> ${ref}`);
    }
  });
}

test('sitemap.xml lista as duas páginas; robots.txt aponta o sitemap e bloqueia pastas internas', () => {
  const s = read('docs/sitemap.xml');
  assert.ok(s.includes(`<loc>${SITE}</loc>`) && s.includes(`<loc>${SITE}pt-br/</loc>`));
  const r = read('docs/robots.txt');
  assert.ok(r.includes(`Sitemap: ${SITE}sitemap.xml`));
  for (const d of ['/superpowers/', '/design/']) assert.ok(r.includes(`Disallow: ${d}`), d);
});

test('og-image.png tem 1200x630', () => {
  const b = fs.readFileSync(path.join(ROOT, 'docs/images/og-image.png'));
  assert.equal(b.readUInt32BE(16), 1200);
  assert.equal(b.readUInt32BE(20), 630);
});

test('manifest.homepage_url aponta para o site', () => {
  assert.equal(JSON.parse(read('manifest.json')).homepage_url, SITE);
});

test('README: H1 e primeiro parágrafo com as palavras-chave e link para o site; idem em português', () => {
  const en = read('README.md');
  assert.match(en.split('\n').find((l) => l.startsWith('# ')), /Pinterest Dark Mode/i);
  assert.match(en, /sepia/i);
  assert.ok(en.includes(SITE));
  const pt = read('README.pt-BR.md');
  assert.match(pt.split('\n').find((l) => l.startsWith('# ')), /Modo Escuro do Pinterest/i);
  assert.ok(pt.includes(SITE + 'pt-br/'));
});

test('en/pt_BR: descrição do manifest cita "dark mode" / "modo escuro"', () => {
  const m = (l) => JSON.parse(read(`_locales/${l}/messages.json`)).extDescription.message;
  for (const l of ['en', 'en_US', 'en_GB', 'en_AU']) assert.match(m(l), /dark mode/i, l);
  assert.match(m('pt_BR'), /modo escuro/i);
});
