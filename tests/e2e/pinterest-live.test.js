const { test, expect } = require('@playwright/test');
const { launch, pixel } = require('./helpers');

test.skip(!process.env.PT_LIVE, 'defina PT_LIVE=1 para rodar contra pinterest.com (requer rede)');

let env;
test.beforeAll(async () => { env = await launch(); });
test.afterAll(async () => { await env.close(); });

async function open(theme) {
  await env.setSettings({ theme, otherSites: true });
  const page = await env.context.newPage();
  await page.goto('https://www.pinterest.com/search/pins/?q=interior', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ptSite === 'pinterest');
  await page.waitForTimeout(4000);
  if (process.env.PT_SHOTS) await page.screenshot({ path: `${process.env.PT_SHOTS}/${theme}.png` });
  return page;
}

test('pinterest.com recebe data-pt-site="pinterest" e data-pt-theme="dark"', async () => {
  const page = await open('dark');
  expect(await page.evaluate(() => document.documentElement.dataset.ptTheme)).toBe('dark');
  expect(await page.evaluate(() => document.documentElement.dataset.ptSite)).toBe('pinterest');
});

const near = (rgb, target, tol) => rgb.forEach((c, i) => expect(Math.abs(c - target[i])).toBeLessThanOrEqual(tol));

test('dark: superfície do site é cinza cimento (nem branca, nem preta)', async () => {
  const page = await open('dark');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(43, 45, 47)');
  near(await pixel(page, 400, 10), [43, 45, 47], 6); // topo do modal de login, sem scrim
});

test('sepia: superfície do site é papel quente', async () => {
  const page = await open('sepia');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(244, 236, 216)');
  near(await pixel(page, 400, 10), [244, 236, 216], 8);
});
