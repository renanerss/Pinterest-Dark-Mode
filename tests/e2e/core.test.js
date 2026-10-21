const { test, expect } = require('@playwright/test');
const { launch, pixel } = require('./helpers');

let env;
test.beforeAll(async () => { env = await launch(); });
test.afterAll(async () => { await env.close(); });

async function open(settings) {
  await env.setSettings(settings);
  const page = await env.context.newPage();
  await page.goto(env.baseUrl);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-pt-theme'));
  await page.waitForTimeout(150);
  return page;
}
const near = (rgb, target, tol) => rgb.forEach((c, i) => expect(Math.abs(c - target[i])).toBeLessThanOrEqual(tol));

test('dark: página branca vira cinza cimento', async () => {
  const page = await open({ theme: 'dark', otherSites: true });
  near(await pixel(page, 400, 400), [46, 46, 46], 5);
});

test('dark: imagem e iframe mantêm o matiz', async () => {
  const page = await open({ theme: 'dark', otherSites: true });
  for (const sel of ['#red', '#frame']) {
    const b = await page.locator(sel).boundingBox();
    const [r, g, bl] = await pixel(page, b.x + 10, b.y + 10);
    expect(r).toBeGreaterThan(120); expect(r - g).toBeGreaterThan(40); expect(r - bl).toBeGreaterThan(40); // matiz vermelho preservado (saturação cai um pouco)
  }
});

test('sepia: página branca vira papel quente', async () => {
  const page = await open({ theme: 'sepia', otherSites: true });
  near(await pixel(page, 400, 400), [244, 236, 216], 6);
});

test('light: página intocada', async () => {
  const page = await open({ theme: 'light', otherSites: true });
  near(await pixel(page, 400, 400), [255, 255, 255], 0);
});

test('otherSites=false deixa site não-Pinterest intacto', async () => {
  const page = await open({ theme: 'dark', otherSites: false });
  near(await pixel(page, 400, 400), [255, 255, 255], 0);
});

test('troca de tema no storage aplica sem recarregar', async () => {
  const page = await open({ theme: 'dark', otherSites: true });
  await env.setSettings({ theme: 'sepia' });
  await page.waitForFunction(() => document.documentElement.dataset.ptTheme === 'sepia');
  await page.waitForTimeout(150);
  near(await pixel(page, 400, 400), [244, 236, 216], 6);
});

test('impressão continua clara', async () => {
  const page = await open({ theme: 'dark', otherSites: true });
  await page.emulateMedia({ media: 'print' });
  near(await pixel(page, 400, 400), [255, 255, 255], 0);
});

test('atributo data-pt-theme presente em DOMContentLoaded', async () => {
  await env.setSettings({ theme: 'dark', otherSites: true });
  const page = await env.context.newPage();
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      window.__ptAtDcl = document.documentElement.getAttribute('data-pt-theme');
    });
  });
  await page.goto(env.baseUrl); // primeira visita grava o cache do site
  await page.waitForFunction(() => document.documentElement.dataset.ptTheme === 'dark');
  await page.reload();
  expect(await page.evaluate(() => window.__ptAtDcl)).toBe('dark');
});

test('valor corrompido no storage cai no padrão (dark)', async () => {
  const page = await open({ theme: 'neon', otherSites: 'sim' });
  expect(await page.evaluate(() => document.documentElement.dataset.ptTheme)).toBe('dark');
});

async function openPath(path, settings) {
  await env.setSettings(settings);
  const page = await env.context.newPage();
  await page.goto(env.baseUrl + path);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-pt-theme'));
  await page.waitForTimeout(150);
  return page;
}

test('dark: página sem fundo próprio também vira cinza cimento (não preto)', async () => {
  const page = await openPath('/nobg.html', { theme: 'dark', otherSites: true });
  near(await pixel(page, 400, 400), [46, 46, 46], 5);
});

test('dark: imagem dentro de <picture> não é invertida em dobro', async () => {
  const page = await openPath('/nobg.html', { theme: 'dark', otherSites: true });
  const b = await page.locator('#pic').boundingBox();
  const [r, g, bl] = await pixel(page, b.x + 10, b.y + 10);
  expect(r).toBeGreaterThan(120); expect(r - g).toBeGreaterThan(40); expect(r - bl).toBeGreaterThan(40); // matiz vermelho preservado (saturação cai um pouco)
});

test('dark: imagem comum mantém o matiz', async () => {
  const page = await open({ theme: 'dark', otherSites: true });
  const b = await page.locator('#red').boundingBox();
  const [r, g, bl] = await pixel(page, b.x + 10, b.y + 10);
  expect(r).toBeGreaterThan(120); expect(r - g).toBeGreaterThan(40); expect(r - bl).toBeGreaterThan(40); // matiz vermelho preservado (saturação cai um pouco)
});
