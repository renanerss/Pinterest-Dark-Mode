const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');
const { extensionIdFromKey } = require('../../scripts/gen-key.js');

const ROOT = path.resolve(__dirname, '../..');
const EXT_DIR = path.join(ROOT, 'dist/test'); // gerado por: node scripts/build.js --test

async function launch({ variant = 'test' } = {}) {
  const EXT = path.join(ROOT, variant === 'store' ? 'dist/extension' : 'dist/test');
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  let extensionId = manifest.key ? extensionIdFromKey(manifest.key) : null;

  const fixtureDir = path.join(ROOT, 'tests/fixture');
  const server = http.createServer((req, res) => {
    const file = path.join(fixtureDir, req.url === '/' ? 'page.html' : req.url.split('?')[0]);
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-ext-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 800, height: 600 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });

  if (!extensionId) {
    const sw = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
    extensionId = new URL(sw.url()).host;
  }

  async function setSettings(patch) {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.evaluate((p) => chrome.storage.sync.set(p), patch);
    // o service worker registra/remove o script dos outros sites: espera o estado estabilizar
    // atenção: waitForFunction com função async nunca espera (a Promise é sempre truthy); por isso o polling é feito aqui
    for (let i = 0; ; i++) {
      const ok = await page.evaluate(async () => {
        const s = await chrome.storage.sync.get(null);
        const reg = await chrome.scripting.getRegisteredContentScripts({ ids: ['pt-other-sites'] });
        return reg.length === (s.otherSites === true ? 1 : 0);
      });
      if (ok) break;
      if (i > 100) throw new Error('registro do script dos outros sites não estabilizou em 10 s');
      await page.waitForTimeout(100);
    }
    await page.close();
  }

  async function close() {
    await context.close();
    server.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  return { context, extensionId, baseUrl, setSettings, close };
}

async function pixel(page, x, y) {
  const buf = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  const png = PNG.sync.read(buf);
  return [png.data[0], png.data[1], png.data[2]];
}

module.exports = { launch, pixel };
