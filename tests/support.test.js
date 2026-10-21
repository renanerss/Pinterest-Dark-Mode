const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const BMC = 'https://buymeacoffee.com/renanerslif';

for (const file of ['README.md', 'README.pt-BR.md']) {
  test(`${file}: link de apoio do Buy Me a Coffee (endereço limpo)`, () => {
    const md = read(file);
    assert.ok(md.includes(`(${BMC})`), 'link markdown');
    assert.ok(!md.includes('?new=1'));
  });
}

for (const file of ['docs/index.html', 'docs/pt-br/index.html']) {
  test(`${file}: seção de apoio com link seguro e sem parâmetro de cadastro`, () => {
    const html = read(file);
    const links = [...html.matchAll(/<a\b[^>]*href="https:\/\/buymeacoffee\.com\/renanerslif"[^>]*>/g)].map((m) => m[0]);
    assert.ok(links.length >= 1, 'pelo menos um link');
    for (const l of links) assert.match(l, /rel="noopener"/, l);
    assert.ok(!html.includes('?new=1'));
    assert.ok(html.includes('id="apoio"') || html.includes('id="support"'));
  });
}

test('.github/FUNDING.yml habilita o botão "Sponsor" do GitHub com o Buy Me a Coffee', () => {
  assert.match(read('.github/FUNDING.yml'), /^buy_me_a_coffee: renanerslif\s*$/m);
});

test('a extensão em si não exibe pedido de doação (popup e content script)', () => {
  for (const f of ['popup/popup.html', 'popup/popup.js', 'src/content.js', 'src/background.js']) {
    assert.ok(!/buymeacoffee/i.test(read(f)), f);
  }
});
