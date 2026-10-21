const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/settings.js');

test('normalizeSettings(undefined) devolve DEFAULTS', () => {
  assert.deepEqual(S.normalizeSettings(undefined), S.DEFAULTS);
});
test('normalizeSettings com valores inválidos devolve DEFAULTS', () => {
  assert.deepEqual(S.normalizeSettings({ theme: 'neon', otherSites: 'sim' }), S.DEFAULTS);
});
test('normalizeSettings preserva valores válidos', () => {
  assert.deepEqual(S.normalizeSettings({ theme: 'sepia', otherSites: false }), { theme: 'sepia', otherSites: false });
});
test('normalizeSettings corrige campo a campo', () => {
  assert.deepEqual(S.normalizeSettings({ theme: 'sepia', otherSites: 'x' }), { theme: 'sepia', otherSites: true });
});
test('isPinterestHost verdadeiro para domínios do Pinterest', () => {
  for (const h of ['pinterest.com', 'www.pinterest.com', 'br.pinterest.com', 'pinterest.com.au', 'www.pinterest.co.uk']) {
    assert.equal(S.isPinterestHost(h), true, h);
  }
});
test('isPinterestHost falso para outros', () => {
  for (const h of ['notpinterest.com', 'pinterest.com.evil.io', 'example.com']) {
    assert.equal(S.isPinterestHost(h), false, h);
  }
});
test('effectiveTheme: outro site com otherSites=false => light', () => {
  assert.equal(S.effectiveTheme({ theme: 'dark', otherSites: false }, 'example.com'), 'light');
});
test('effectiveTheme: pinterest ignora otherSites', () => {
  assert.equal(S.effectiveTheme({ theme: 'dark', otherSites: false }, 'br.pinterest.com'), 'dark');
});
test('effectiveTheme: outro site com otherSites=true usa o tema', () => {
  assert.equal(S.effectiveTheme({ theme: 'sepia', otherSites: true }, 'example.com'), 'sepia');
});
