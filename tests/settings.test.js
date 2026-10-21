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
  assert.deepEqual(S.normalizeSettings({ theme: 'sepia', otherSites: 'x' }), { theme: 'sepia', otherSites: false });
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

// ---- permissões sob demanda ----
const fs = require('node:fs');
const path = require('node:path');

function fakeChrome({ granted = true, requestResult = true } = {}) {
  const store = {};
  const calls = { request: 0, remove: 0 };
  globalThis.chrome = {
    storage: { sync: {
      get: async () => { await new Promise((r) => setTimeout(r, 5)); return { ...store }; },
      set: async (o) => { await new Promise((r) => setTimeout(r, 5)); Object.assign(store, o); },
    } },
    permissions: {
      request: async () => { calls.request++; return requestResult; },
      remove: async () => { calls.remove++; return true; },
      contains: async () => granted,
    },
  };
  return { store, calls };
}

test('DEFAULTS.otherSites é false', () => {
  assert.equal(S.DEFAULTS.otherSites, false);
});
test('save: dois saves concorrentes de campos diferentes preservam ambos', async () => {
  const { store } = fakeChrome();
  await Promise.all([S.save({ theme: 'sepia' }), S.save({ otherSites: true })]);
  assert.deepEqual(store, { theme: 'sepia', otherSites: true });
});
test('save ignora valores inválidos do patch', async () => {
  const { store } = fakeChrome();
  await S.save({ theme: 'neon', otherSites: 'sim' });
  assert.deepEqual(store, {});
});
test('reconcileOtherSites: otherSites true sem permissão => desliga e não registra', () => {
  const r = S.reconcileOtherSites({ theme: 'dark', otherSites: true }, false);
  assert.equal(r.register, false);
  assert.equal(r.settings.otherSites, false);
});
test('reconcileOtherSites: otherSites true com permissão => registra', () => {
  const r = S.reconcileOtherSites({ theme: 'dark', otherSites: true }, true);
  assert.equal(r.register, true);
  assert.equal(r.settings.otherSites, true);
});
test('reconcileOtherSites: otherSites false com permissão => não registra', () => {
  assert.equal(S.reconcileOtherSites({ theme: 'dark', otherSites: false }, true).register, false);
});
test('setOtherSites(true) com permissão negada devolve false e não grava true', async () => {
  const { store } = fakeChrome({ requestResult: false });
  assert.equal(await S.setOtherSites(true), false);
  assert.notEqual(store.otherSites, true);
});
test('setOtherSites(true) concedida grava true e devolve true', async () => {
  const { store } = fakeChrome();
  assert.equal(await S.setOtherSites(true), true);
  assert.equal(store.otherSites, true);
});
test('setOtherSites(false) remove a permissão e grava false', async () => {
  const { store, calls } = fakeChrome();
  assert.equal(await S.setOtherSites(false), false);
  assert.equal(calls.remove, 1);
  assert.equal(store.otherSites, false);
});
test('manifest: todo match estático é host do Pinterest e não há "<all_urls>" estático', () => {
  const m = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../manifest.json'), 'utf8'));
  const matches = m.content_scripts.flatMap((c) => c.matches);
  assert.ok(matches.length > 20);
  for (const p of matches) {
    assert.notEqual(p, '<all_urls>');
    const host = p.replace('*://*.', '').replace('/*', '');
    assert.equal(S.isPinterestHost(host), true, p);
    assert.equal(S.isPinterestHost('www.' + host), true, 'www.' + host);
  }
  assert.deepEqual(m.permissions, ['storage', 'scripting']);
  assert.deepEqual(m.optional_host_permissions, ['<all_urls>']);
  assert.equal(m.host_permissions, undefined);
});
