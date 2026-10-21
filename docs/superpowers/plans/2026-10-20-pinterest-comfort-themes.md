# Pinterest Comfort Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extensão Chrome (MV3) com 3 temas — Claro, Escuro (cinza cimento) e Sépia — otimizada para o Pinterest e aplicável, opcionalmente, a outros sites.

**Architecture:** Um content script (`document_start`) lê o tema salvo em `chrome.storage.sync` e grava `data-pt-theme` / `data-pt-site` no `<html>`. Todo o CSS é estático, declarado no manifest e escopado por esses atributos (inerte no tema Claro). Sites genéricos usam um motor de filtro (invert + hue-rotate para escuro; overlay `multiply` para sépia) com mídia protegida; o Pinterest ganha uma camada própria que sobrescreve as cores do site (descobertas na Task 4), preservando as imagens dos pins. O popup só escreve no storage; abas abertas reagem via `storage.onChanged`.

**Tech Stack:** JavaScript puro (sem build), Manifest V3, `node:test` (lógica pura), Playwright + `pngjs` (e2e com a extensão carregada), Node 24.

**Spec:** Pedido do usuário (sem documento separado), resumido em *Global Constraints*.

## Global Constraints

- Temas, nesta ordem e com estes ids: `light` ("Claro", = site original, nada é aplicado), `dark` ("Escuro"), `sepia` ("Sépia").
- Escuro = **cinza cimento escuro, nunca preto puro**: fundo de página ≈ `#2e2e2e` (±5 por canal), texto ≈ `#d1d1d1`. Para o Pinterest, tokens: `--pt-bg:#2b2d2f; --pt-surface:#34373a; --pt-text:#d9dadb; --pt-muted:#a0a4a8; --pt-border:#44484c`.
- Sépia = papel quente de baixo cansaço: fundo ≈ `#f4ecd8` (±6 por canal). Tokens Pinterest: `--pt-bg:#f4ecd8; --pt-surface:#efe4cb; --pt-text:#5b4636; --pt-muted:#8a7560; --pt-border:#d9c9a8`.
- Prioridade máxima: Pinterest (`pinterest.com` e domínios regionais). Outros sites: melhor esforço, controlados pela opção `otherSites` (padrão `true`).
- Configuração padrão: `{ theme: 'dark', otherSites: true }`, em `chrome.storage.sync`.
- Texto de interface em português do Brasil. Sem build, sem framework, sem dependências de runtime.
- Todo CSS de tema fica dentro de `@media screen` (impressão sempre clara).
- Fotos, vídeos, canvas e iframes nunca podem ficar com as cores invertidas.
- Fora de escopo (YAGNI): ícones, publicação na Web Store, temas customizáveis, agendamento por horário.

## Review Focus

- Flash branco antes do tema: o atributo precisa estar no `<html>` até `DOMContentLoaded` (Task 2).
- Impressão (`@media print`) deve sair clara, sem filtro/overlay (Task 2).
- Imagens, `<video>` e `<iframe>` (ex.: embed do YouTube) não podem sair invertidos/ciano (Task 2).
- Valor corrompido/desconhecido no storage (`theme:'neon'`, `otherSites:'sim'`) cai nos padrões sem quebrar (Tasks 1 e 2).
- Troca de tema pelo popup atualiza abas já abertas sem recarregar, inclusive o SPA do Pinterest (Tasks 2 e 3).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `.gitignore` | scripts `test` e `test:e2e`; devDeps `@playwright/test`, `pngjs` |
| `manifest.json` | MV3, content script + CSS, popup, `key` fixa (id estável p/ testes) |
| `src/settings.js` | lógica pura + acesso ao storage; script clássico exposto como `globalThis.PTSettings` e `module.exports` |
| `src/content.js` | aplica atributos no `<html>` e reage a mudanças |
| `css/tokens.css` | variáveis `--pt-*` por tema |
| `css/generic.css` | motor de filtro/overlay para sites não-Pinterest |
| `css/pinterest.css` | camada do Pinterest (Task 4) |
| `popup/popup.html`, `popup.css`, `popup.js` | seletor de tema |
| `tests/settings.test.js` | unit tests |
| `tests/e2e/helpers.js`, `tests/e2e/*.test.js`, `tests/fixture/page.html` | e2e com Playwright |
| `docs/pinterest-notes.md`, `README.md` | descobertas do Pinterest; como carregar a extensão |

---

### Task 1: Módulo de configurações (lógica pura)

**Files:**
- Create: `package.json`, `.gitignore`, `src/settings.js`, `tests/settings.test.js`

**Interfaces:**
- Produces (`src/settings.js`, também `globalThis.PTSettings`):
  - `THEME_IDS: ['light','dark','sepia']`, `DEFAULTS: {theme:'dark', otherSites:true}`
  - `normalizeSettings(raw: unknown): {theme: ThemeId, otherSites: boolean}` — cada campo inválido cai no padrão individualmente
  - `isPinterestHost(hostname: string): boolean` — `pinterest.<tld>` ou `pinterest.<com|co>.<cc>`, com qualquer subdomínio
  - `effectiveTheme(settings, hostname: string): ThemeId` — `'light'` se o site não é Pinterest e `otherSites` é `false`; senão `settings.theme`
  - `load(): Promise<Settings>`, `save(patch: Partial<Settings>): Promise<void>` (via `chrome.storage.sync`, passando por `normalizeSettings`)

- [ ] **Step 1: `git init`, criar `package.json` (`"test": "node --test tests/settings.test.js"`, `"test:e2e": "playwright test tests/e2e"`) e `.gitignore` (`node_modules`, `test-results`)**
- [ ] **Step 2: Escrever `tests/settings.test.js`** (CommonJS, `require('../src/settings.js')`):

```js
test('normalizeSettings(undefined) devolve DEFAULTS')
test('normalizeSettings({theme:"neon", otherSites:"sim"}) devolve DEFAULTS')
test('normalizeSettings({theme:"sepia", otherSites:false}) preserva ambos')
test('normalizeSettings({theme:"sepia", otherSites:"x"}) => {theme:"sepia", otherSites:true}')
test('isPinterestHost verdadeiro para pinterest.com, www.pinterest.com, br.pinterest.com, pinterest.com.au, www.pinterest.co.uk')
test('isPinterestHost falso para notpinterest.com, pinterest.com.evil.io, example.com')
test('effectiveTheme: example.com + otherSites:false => "light"')
test('effectiveTheme: br.pinterest.com + otherSites:false + theme:"dark" => "dark"')
test('effectiveTheme: example.com + otherSites:true + theme:"sepia" => "sepia"')
```

- [ ] **Step 3: Rodar `npm test`** — esperado: FAIL (módulo inexistente).
- [ ] **Step 4: Implementar `src/settings.js`** conforme as assinaturas acima; `load`/`save` só tocam `chrome.*` quando chamados (para o arquivo ser requerível no Node).
- [ ] **Step 5: Rodar `npm test`** — esperado: 9 testes PASS.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: settings module"` (com a linha Co-Authored-By exigida).

---

### Task 2: Núcleo da extensão (manifest, content script, CSS genérico) + harness e2e

**Files:**
- Create: `manifest.json`, `src/content.js`, `css/tokens.css`, `css/generic.css`, `css/pinterest.css` (vazio por ora), `popup/popup.html` (placeholder mínimo, também usado pelos testes para alcançar `chrome.storage`), `scripts/gen-key.js`, `tests/fixture/page.html`, `tests/e2e/helpers.js`, `tests/e2e/core.test.js`, `playwright.config.js`
- Modify: `package.json` (devDeps)

**Interfaces:**
- Consumes: `PTSettings.load`, `effectiveTheme`, `isPinterestHost` (Task 1)
- Produces:
  - Atributos no `<html>`: `data-pt-theme` ∈ `light|dark|sepia` e `data-pt-site` ∈ `pinterest|other`
  - `tests/e2e/helpers.js`: `launch(): Promise<{context, extensionId, baseUrl, setSettings(patch), close()}>` (Chromium persistente com `--load-extension`, servidor HTTP local servindo `tests/fixture/`; `setSettings` abre `chrome-extension://<id>/popup/popup.html` e chama `chrome.storage.sync.set`) e `pixel(page, x, y): Promise<[r,g,b]>` (screenshot recortado + `pngjs`)

- [ ] **Step 1: `npm i -D @playwright/test pngjs` e `npx playwright install chromium`.**
- [ ] **Step 2: `scripts/gen-key.js`** — gera um par RSA-2048 com `crypto.generateKeyPairSync`, imprime a chave pública SPKI/DER em base64 (vai em `manifest.json` → `"key"`) e o id derivado (primeiros 32 hex do SHA-256 do DER, cada dígito hex mapeado `0-f → a-p`). Descarta a chave privada. `helpers.js` recalcula o id a partir do `key` do manifest.
- [ ] **Step 3: `tests/fixture/page.html`** — fundo `#fff`, texto preto, `<img id="red">` 40×40 vermelho (data URI), `<iframe id="frame" srcdoc="<body style='background:#f00'>">` e `<p>`.
- [ ] **Step 4: Escrever `tests/e2e/core.test.js`** (sem `data-pt-*` implementado ainda); cada teste abre a fixture em `baseUrl`:

```js
test('dark: página branca vira cinza cimento')        // pixel(5,5): cada canal em 46±5
test('dark: imagem e iframe mantêm o matiz')           // #red e #frame: r>150, g<90, b<90
test('sepia: página branca vira papel quente')         // pixel(5,5) ≈ [244,236,216] ±6
test('light: página intocada')                         // pixel(5,5) = [255,255,255]
test('otherSites=false deixa site não-Pinterest intacto') // theme dark + otherSites false => branco
test('troca de tema no storage aplica sem recarregar') // setSettings({theme:'sepia'}) com a aba aberta
test('impressão continua clara')                       // page.emulateMedia({media:'print'}) => branco
test('atributo data-pt-theme presente em DOMContentLoaded') // addInitScript registra listener e lê o atributo
test('valor corrompido no storage cai no padrão (dark)')   // setSettings({theme:'neon'})
```

- [ ] **Step 5: Rodar `npm run test:e2e`** — esperado: FAIL (extensão sem manifest).
- [ ] **Step 6: Implementar.**
  - `manifest.json`: `manifest_version:3`, nome "Pinterest Comfort Themes", `permissions:["storage"]`, `action.default_popup:"popup/popup.html"`, `content_scripts:[{matches:["<all_urls>"], run_at:"document_start", js:["src/settings.js","src/content.js"], css:["css/tokens.css","css/generic.css","css/pinterest.css"]}]`.
  - `src/content.js`: `apply()` carrega as configurações, calcula `effectiveTheme(settings, location.hostname)` e grava os dois atributos em `document.documentElement`; chama `apply()` na carga e em `chrome.storage.onChanged`.
  - `css/tokens.css`: `html[data-pt-theme="dark"|"sepia"]` definem os tokens `--pt-*` das *Global Constraints* e `color-scheme`.
  - `css/generic.css`, tudo em `@media screen` e com `:not([data-pt-site="pinterest"])`:
    - escuro: `html{filter:invert(1) hue-rotate(180deg) contrast(.64)}` + `img,video,canvas,picture,iframe{filter:invert(1) hue-rotate(180deg)}` (contrast .64 leva preto→46 e branco→209);
    - sépia: `html::after` fixo, `inset:0`, `background:#f4ecd8`, `mix-blend-mode:multiply`, `pointer-events:none`, `z-index:2147483647`.
- [ ] **Step 7: Rodar `npm run test:e2e`** — esperado: 9 PASS. Se o pixel do escuro/sépia sair fora da tolerância, ajustar só os valores do CSS, não os testes.
- [ ] **Step 8: Commit** — `git commit -m "feat: content script and generic theme engine"`.

---

### Task 3: Popup de seleção de tema

**Files:**
- Modify: `popup/popup.html`
- Create: `popup/popup.css`, `popup/popup.js`, `tests/e2e/popup.test.js`

**Interfaces:**
- Consumes: `PTSettings.load/save/THEME_IDS` (Task 1); helpers `launch`, `pixel` (Task 2)
- Produces: popup com 3 cartões `button[data-theme="light|dark|sepia"]` (rótulos "Claro", "Escuro", "Sépia", cada um com amostra de cor do tema; o ativo tem `aria-pressed="true"`) e um checkbox `#other-sites` ("Aplicar em outros sites")

- [ ] **Step 1: Escrever `tests/e2e/popup.test.js`:**

```js
test('popup abre refletindo as configurações salvas')            // setSettings({theme:'sepia'}); botão sepia com aria-pressed=true
test('clicar em "Escuro" salva theme=dark e escurece aba aberta') // aba da fixture aberta; pixel(5,5) ≈ 46±5 sem reload
test('desmarcar "Aplicar em outros sites" salva otherSites=false e clareia a aba') // pixel = branco
```

- [ ] **Step 2: Rodar `npm run test:e2e -- popup`** — esperado: FAIL.
- [ ] **Step 3: Implementar popup** (HTML semântico, `lang="pt-BR"`, foco visível, navegável por teclado; `popup.js` renderiza o estado de `PTSettings.load()` e chama `PTSettings.save(patch)` a cada clique; popup com a paleta do tema ativo não é necessário).
- [ ] **Step 4: Rodar `npm run test:e2e`** — esperado: tudo PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: theme picker popup"`.

---

### Task 4: Camada do Pinterest + README

**Files:**
- Create: `docs/pinterest-notes.md`, `README.md`, `tests/e2e/pinterest-live.test.js`
- Modify: `css/pinterest.css`, `css/generic.css` (só se a decisão do Step 2 for "fallback")

**Interfaces:**
- Consumes: atributos `data-pt-theme`/`data-pt-site` e tokens `--pt-*` (Task 2)
- Produces: tema Escuro/Sépia aplicado às superfícies do Pinterest com `data-pt-site="pinterest"`; teste ao vivo opcional (`PT_LIVE=1`)

- [ ] **Step 1: Descoberta (browser, sem login).** Abrir `https://www.pinterest.com/` no navegador embutido; via JS, listar as custom properties `--color-*` (Gestalt) em `:root`/`body`/`.__gestaltTheme`, os atributos `data-test-id` das superfícies (cabeçalho, feed, pin aberto, modal, dropdown de busca) e como o site marca modo escuro nativo, se houver. Registrar tudo em `docs/pinterest-notes.md` (variável → papel → token `--pt-*` correspondente).
- [ ] **Step 2: Decisão (registrar no notes).** Se sobrescrever as variáveis cobre as 5 superfícies do Step 1 → usar a camada própria (`pinterest.css` redefine as variáveis a partir dos tokens, sob `html[data-pt-site="pinterest"][data-pt-theme=...]`, e as imagens dos pins não recebem filtro algum). Se não cobrir → fallback: o Pinterest passa a usar o filtro genérico e `pinterest.css` só protege `img, video, [data-test-id="pin"] picture` com o contra-filtro; remover o `:not([data-pt-site="pinterest"])` do `generic.css` e ajustar os testes da Task 2 se necessário.
- [ ] **Step 3: Escrever `tests/e2e/pinterest-live.test.js`** (pula sem `PT_LIVE=1`; exige rede):

```js
test('pinterest.com recebe data-pt-site="pinterest" e data-pt-theme="dark"')
test('dark: fundo do feed não é branco nem preto puro')   // pixel em área sem pin: cada canal entre 25 e 80
test('sepia: fundo do feed é quente')                      // r > b + 15, todos > 200
```

- [ ] **Step 4: Implementar `pinterest.css`** conforme a decisão e rodar `PT_LIVE=1 npm run test:e2e -- pinterest-live` — esperado: PASS.
- [ ] **Step 5: Verificação manual** (documentar o resultado em `docs/pinterest-notes.md`): carregar descompactada em `chrome://extensions`, e conferir no Pinterest, nos 3 temas: feed, pin aberto, busca com dropdown, pasta/board, modal de salvar, página de perfil, vídeo-pin. Nada com texto ilegível ou fundo branco residual; pins com cores originais.
- [ ] **Step 6: `README.md`** — como carregar a extensão (Carregar sem compactação), uso do popup, como rodar `npm test` / `npm run test:e2e` / `PT_LIVE=1`.
- [ ] **Step 7: Commit** — `git commit -m "feat: pinterest theme layer and docs"`.

---

## Self-Review

- **Cobertura:** 3 temas (Tasks 1–3), cinza cimento e sépia confortáveis (valores fixos nas constraints + testes de pixel), Pinterest prioritário (Task 4), outros sites opcionais (`otherSites`, Tasks 1–3). Todos os itens do Review Focus têm teste (flash e impressão, mídia e corrompido, ao vivo: Task 2/3).
- **Consistência de tipos:** `PTSettings.{load,save,normalizeSettings,effectiveTheme,isPinterestHost,THEME_IDS,DEFAULTS}`, atributos `data-pt-theme`/`data-pt-site` e helpers `launch/pixel/setSettings` usam os mesmos nomes em todas as tasks.
- **Risco principal:** as cores nativas do Pinterest só são conhecidas após o Step 1 da Task 4; por isso o plano tem um critério de decisão explícito (camada própria vs. fallback por filtro) em vez de seletores adivinhados.
