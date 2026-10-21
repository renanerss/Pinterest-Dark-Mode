const { test, expect } = require('@playwright/test');
const { launch } = require('./helpers');

// Build da loja: sem host_permissions, sem "key" — a permissão de "outros sites" NÃO está concedida.
let env;
test.beforeAll(async () => { env = await launch({ variant: 'store' }); });
test.afterAll(async () => { await env.close(); });

async function ext() {
  const page = await env.context.newPage();
  await page.goto(`chrome-extension://${env.extensionId}/popup/popup.html`);
  return page;
}

test('otherSites:true salvo sem permissão é corrigido para false e nenhum script é registrado', async () => {
  const page = await ext();
  await page.evaluate(() => chrome.storage.sync.set({ theme: 'dark', otherSites: true }));
  await expect.poll(() => page.evaluate(async () => (await chrome.storage.sync.get('otherSites')).otherSites), { timeout: 10000 }).toBe(false);
  expect(await page.evaluate(async () => (await chrome.scripting.getRegisteredContentScripts()).length)).toBe(0);
  const site = await env.context.newPage();
  await site.goto(env.baseUrl);
  await site.waitForTimeout(300);
  expect(await site.evaluate(() => document.documentElement.hasAttribute('data-pt-theme'))).toBe(false);
});

test('permissions do pacote da loja: sem host_permissions concedidas', async () => {
  const page = await ext();
  const perms = await page.evaluate(() => chrome.permissions.getAll());
  expect(perms.origins.filter((o) => o === '<all_urls>' || o.includes('127.0.0.1'))).toEqual([]);
});
