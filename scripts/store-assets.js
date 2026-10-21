// Gera os materiais gráficos da loja em dist/store/ (estilo Cohere: canvas branco, banda verde #003c33, tipografia grande e justa).
//   promo-small.png (440x280), screenshot-popup.png (1280x800) e, com PT_LIVE=1 / { live: true },
//   screenshot-pinterest-{light,dark,sepia}.png (1280x800, busca pública do Pinterest sem login).
// Requer: node scripts/build.js --test  (usa a variante de testes da extensão no Chromium do Playwright).
const fs = require('node:fs');
const path = require('node:path');
const { launch } = require('../tests/e2e/helpers');

const FONT = `'Inter', Arial, ui-sans-serif, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`;

const promoHtml = () => `<!doctype html><html><body style="margin:0;width:440px;height:280px;background:#003c33;color:#fff;font-family:${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;padding:32px 32px 28px">
    <div style="font:400 12px/1.4 ${MONO};letter-spacing:.28px;text-transform:uppercase;color:#edfce9">Chrome extension</div>
    <div style="margin-top:14px;font-size:40px;line-height:1;letter-spacing:-.8px;font-weight:400">Soft themes<br>for Pinterest</div>
    <div style="position:absolute;left:32px;bottom:28px;display:flex;gap:10px;align-items:center">
      <span style="width:36px;height:36px;border-radius:9999px;background:#2e2e2e;border:1px solid #d9d9dd"></span>
      <span style="width:36px;height:36px;border-radius:9999px;background:#f4ecd8;border:1px solid #d9d9dd"></span>
      <span style="width:36px;height:36px;border-radius:9999px;background:#fff;border:1px solid #d9d9dd"></span>
      <span style="margin-left:8px;font:400 14px/1.4 ${FONT};color:#edfce9">Dark · Sepia · Light</span>
    </div>
  </div></body></html>`;

const popupShotHtml = (popupPngBase64) => `<!doctype html><html><body style="margin:0;width:1280px;height:800px;background:#fff;color:#212121;font-family:${FONT};position:relative">
  <div style="position:absolute;left:96px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center">
    <div style="font:400 14px/1.4 ${MONO};letter-spacing:.28px;text-transform:uppercase;color:#75758a">Soft themes for Pinterest</div>
    <div style="margin-top:20px;font-size:72px;line-height:1;letter-spacing:-1.44px;font-weight:400">Easy on<br>the eyes.</div>
    <div style="margin-top:28px;font-size:18px;line-height:1.4;color:#616161;max-width:460px">A comfortable cement-gray dark theme and a warm sepia theme for Pinterest. Pick one from the toolbar, no reload needed.</div>
  </div>
  <div style="position:absolute;right:96px;top:140px;width:480px;height:520px;background:#eeece7;border-radius:22px;display:flex;align-items:center;justify-content:center">
    <img src="data:image/png;base64,${popupPngBase64}" style="width:360px;border:1px solid #d9d9dd;border-radius:8px;background:#fff">
  </div></body></html>`;

async function generate({ outDir = path.resolve(__dirname, '../dist/store'), live = Boolean(process.env.PT_LIVE) } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const env = await launch();
  try {
    const page = await env.context.newPage();

    await page.setViewportSize({ width: 440, height: 280 });
    await page.setContent(promoHtml());
    await page.screenshot({ path: path.join(outDir, 'promo-small.png') });

    await env.setSettings({ theme: 'dark', otherSites: false });
    const popup = await env.context.newPage();
    await popup.setViewportSize({ width: 640, height: 400 });
    await popup.goto(`chrome-extension://${env.extensionId}/popup/popup.html`);
    await popup.evaluate(async () => {
      const en = await (await fetch('/_locales/en/messages.json')).json();
      window.PTPopup.applyI18n((k) => (en[k] ? en[k].message : ''), 'en');
      document.body.style.zoom = 2;
    });
    const popupPng = await popup.locator('body').screenshot();
    await popup.close();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(popupShotHtml(popupPng.toString('base64')));
    await page.screenshot({ path: path.join(outDir, 'screenshot-popup.png') });

    if (live) {
      for (const theme of ['light', 'dark', 'sepia']) {
        await env.setSettings({ theme, otherSites: false });
        const p = await env.context.newPage();
        await p.setViewportSize({ width: 1280, height: 800 });
        await p.goto('https://www.pinterest.com/search/pins/?q=interior%20design', { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(4000);
        // esconde o modal de login e o scrim (elementos fixos que cobrem a tela) só para a captura
        await p.evaluate(() => {
          for (const e of document.querySelectorAll('body *')) {
            const st = getComputedStyle(e);
            if (st.position === 'fixed' && e.offsetWidth >= innerWidth * 0.9 && e.offsetHeight >= innerHeight * 0.9) e.style.display = 'none';
          }
          document.body.style.overflow = 'auto';
        });
        await p.waitForTimeout(1500);
        await p.screenshot({ path: path.join(outDir, `screenshot-pinterest-${theme}.png`) });
        await p.close();
      }
    }
  } finally {
    await env.close();
  }
  return outDir;
}

if (require.main === module) generate().then((d) => console.log('materiais em', d)).catch((e) => { console.error(e); process.exit(1); });
module.exports = { generate };
