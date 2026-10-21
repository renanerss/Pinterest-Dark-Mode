const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { launch } = require('./helpers');

const LOCALES = fs.readdirSync(path.resolve(__dirname, '../../_locales'));
const RTL = ['ar', 'fa', 'he'];

let env;
test.beforeAll(async () => { env = await launch(); });
test.afterAll(async () => { await env.close(); });

test('popup: em cada um dos 55 idiomas aplica textos e dir, sem overflow horizontal em 320px', async () => {
  const page = await env.context.newPage();
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto(`chrome-extension://${env.extensionId}/popup/popup.html`);
  expect(LOCALES).toHaveLength(55);
  for (const loc of LOCALES) {
    const result = await page.evaluate(async ({ loc }) => {
      const msgs = await (await fetch(`/_locales/${loc}/messages.json`)).json();
      window.PTPopup.applyI18n((k) => (msgs[k] ? msgs[k].message : ''), loc.replace('_', '-'));
      // pior caso: a mensagem de status mais longa do idioma
      const status = document.getElementById('status');
      status.textContent = [msgs.otherSitesHint.message, msgs.permissionDenied.message].sort((a, b) => b.length - a.length)[0];
      const overflow = [...document.querySelectorAll('body, body *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline')
        .map((e) => e.tagName + '.' + e.className);
      return { dir: document.documentElement.dir, label: document.querySelector('[data-theme="dark"] span:last-child').textContent, bodyScroll: document.documentElement.scrollWidth, overflow };
    }, { loc });
    expect(result.label, loc).toBe(JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../_locales/${loc}/messages.json`), 'utf8')).themeDark.message);
    expect(result.dir, loc).toBe(RTL.includes(loc.split('_')[0]) ? 'rtl' : 'ltr');
    expect(result.bodyScroll, loc).toBeLessThanOrEqual(320);
    expect(result.overflow, loc).toEqual([]);
  }
});
