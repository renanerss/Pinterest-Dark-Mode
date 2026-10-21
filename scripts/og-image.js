// Gera docs/images/og-image.png (1200x630): imagem de pré-visualização para compartilhamento (Open Graph / Twitter).
const path = require('node:path');
const { chromium } = require('@playwright/test');

const FONT = `'Inter', Arial, ui-sans-serif, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`;
const html = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#003c33;color:#fff;font-family:${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:80px;top:72px;font:400 22px/1.4 ${MONO};letter-spacing:.4px;text-transform:uppercase;color:#edfce9">Free Chrome extension</div>
  <div style="position:absolute;left:80px;top:140px;width:720px;font-size:92px;line-height:1;letter-spacing:-2px;font-weight:400">Pinterest dark mode, easy on the eyes.</div>
  <div style="position:absolute;left:80px;bottom:72px;display:flex;gap:18px;align-items:center">
    <span style="width:64px;height:64px;border-radius:9999px;background:#2e2e2e;border:2px solid #d9d9dd"></span>
    <span style="width:64px;height:64px;border-radius:9999px;background:#f4ecd8;border:2px solid #d9d9dd"></span>
    <span style="width:64px;height:64px;border-radius:9999px;background:#fff;border:2px solid #d9d9dd"></span>
    <span style="margin-left:14px;font-size:30px;color:#edfce9">Dark · Sepia · Light · 55 languages</span>
  </div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.screenshot({ path: path.resolve(__dirname, '../docs/images/og-image.png') });
  await browser.close();
  console.log('docs/images/og-image.png');
})();
