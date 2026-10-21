const { test, expect } = require('@playwright/test');
const { launch, pixel } = require('./helpers');

let env;
test.beforeAll(async () => { env = await launch(); });
test.afterAll(async () => { await env.close(); });

const popupUrl = () => `chrome-extension://${env.extensionId}/popup/popup.html`;
const near = (rgb, target, tol) => rgb.forEach((c, i) => expect(Math.abs(c - target[i])).toBeLessThanOrEqual(tol));

test('popup abre refletindo as configurações salvas', async () => {
  await env.setSettings({ theme: 'sepia', otherSites: true });
  const popup = await env.context.newPage();
  await popup.goto(popupUrl());
  await expect(popup.locator('button[data-theme="sepia"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(popup.locator('button[data-theme="dark"]')).toHaveAttribute('aria-pressed', 'false');
  await popup.close();
});

test('clicar em "Escuro" salva theme=dark e escurece aba aberta', async () => {
  await env.setSettings({ theme: 'light', otherSites: true });
  const page = await env.context.newPage();
  await page.goto(env.baseUrl);
  const popup = await env.context.newPage();
  await popup.goto(popupUrl());
  await popup.locator('button[data-theme="dark"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.ptTheme === 'dark');
  await page.waitForTimeout(150);
  near(await pixel(page, 400, 400), [46, 46, 46], 5);
  expect(await popup.evaluate(() => chrome.storage.sync.get('theme'))).toEqual({ theme: 'dark' });
  await popup.close();
});

test('desmarcar "Aplicar em outros sites" salva otherSites=false e clareia a aba', async () => {
  await env.setSettings({ theme: 'dark', otherSites: true });
  const page = await env.context.newPage();
  await page.goto(env.baseUrl);
  await page.waitForFunction(() => document.documentElement.dataset.ptTheme === 'dark');
  const popup = await env.context.newPage();
  await popup.goto(popupUrl());
  await popup.locator('#other-sites').uncheck();
  await page.waitForFunction(() => document.documentElement.dataset.ptTheme === 'light');
  await page.waitForTimeout(150);
  near(await pixel(page, 400, 400), [255, 255, 255], 0);
  await popup.close();
});

test('marcar "Aplicar em outros sites" (permissão concedida) salva otherSites=true e mostra a dica', async () => {
  await env.setSettings({ theme: 'dark', otherSites: false });
  const popup = await env.context.newPage();
  await popup.goto(popupUrl());
  await popup.locator('#other-sites').check();
  await expect(popup.locator('#status')).not.toBeEmpty();
  await expect.poll(() => popup.evaluate(() => chrome.storage.sync.get('otherSites'))).toEqual({ otherSites: true });
  await popup.close();
});
