# Chrome Web Store Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a extensão atual (v0.1.0, uso local) num pacote pronto para submissão na Chrome Web Store: permissões mínimas, textos em inglês e português, ícones, materiais da loja, política de privacidade e zip validado.

**Architecture:** O que mais pesa na revisão da loja é a permissão ampla (`<all_urls>` hoje). O content script estático passa a cobrir só os domínios do Pinterest; "Aplicar em outros sites" vira uma permissão opcional (`optional_host_permissions`) pedida em tempo de execução, e um service worker registra o content script dinâmico para os demais sites só quando a permissão existe. Um `scripts/build.js` gera o pacote da loja (sem `key`) e uma variante de testes (com a permissão já concedida) usada pelos e2e.

**Tech Stack:** Manifest V3 (`scripting`, `permissions`, `i18n`), Node 24, Playwright + `pngjs` (já instalados), `adm-zip` (novo, devDependency) para o zip.

**Spec:** Pedido do usuário ("versão para a Chrome Store completa") + plano anterior `docs/superpowers/plans/2026-10-20-pinterest-comfort-themes.md`; as regras da loja estão nas *Global Constraints*.

## Global Constraints

- Manifest V3, `version: "1.0.0"` (igual em `manifest.json` e `package.json`), `minimum_chrome_version: "111"` (usa `color-mix`), `default_locale: "en"`.
- Permissões exatas: `permissions: ["storage", "scripting"]`, `optional_host_permissions: ["<all_urls>"]`; nenhuma `host_permissions` no pacote da loja. Sem `tabs`, sem `<all_urls>` estático.
- Content script estático só nos domínios do Pinterest (lista em `manifest.json`, fonte única; o service worker a lê com `chrome.runtime.getManifest()`).
- Nome ≤ 75 caracteres; descrição do manifest ≤ 132 caracteres. Nome: **"Soft Themes for Pinterest"** (evita usar a marca como nome e acompanha a descrição "Not affiliated with Pinterest"); o ícone não usa o logotipo do Pinterest.
- Idiomas: **todos os 55 que o Chrome aceita em `_locales`** (lista oficial, conferida em 2026-10-20): `ar, am, bg, bn, ca, cs, da, de, el, en, en_AU, en_GB, en_US, es, es_419, et, fa, fi, fil, fr, gu, he, hi, hr, hu, id, it, ja, kn, ko, lt, lv, ml, mr, ms, nl, no, pl, pt_BR, pt_PT, ro, ru, sk, sl, sr, sv, sw, ta, te, th, tr, uk, vi, zh_CN, zh_TW`; `en` é o padrão e todos têm as mesmas chaves. O Chrome escolhe sozinho pelo idioma do navegador (cai em `en` se faltar). `extName` é a marca e fica idêntico em todos; só a descrição e o popup são traduzidos. Idiomas da direita para a esquerda (`ar`, `fa`, `he`) exigem `dir="rtl"` no popup, via `chrome.i18n.getMessage('@@bidi_dir')`, e CSS com propriedades lógicas.
- UI (popup) e materiais gráficos seguem o design system Cohere em `docs/design/DESIGN-cohere.md`: canvas branco `#ffffff`, texto `#212121`, botão primário pílula `#17171c` (raio 32px), cartões com raio 8px/22px e borda `#d9d9dd`, sem sombras, foco `#4c6ee6`, rótulos em caixa alta com fonte mono (`ui-monospace`), corpo `Inter, Arial, ui-sans-serif, system-ui` (as fontes proprietárias não são embutidas), banda `#003c33` só em materiais promocionais; coral e azul não viram fundo.
- Ícones PNG 16, 32, 48 e 128 (RGBA). Materiais: 1–5 screenshots 1280×800 PNG, tile promocional pequeno 440×280 PNG.
- Sem código remoto, sem analytics, nenhum dado sai do dispositivo; preferências ficam em `chrome.storage.sync`.
- O pacote da loja **não** contém `key`, testes, docs, `node_modules` nem scripts. A variante de testes mantém a `key` (id estável) e adiciona `host_permissions: ["<all_urls>"]`.
- `DEFAULTS` passa a ser `{ theme: 'dark', otherSites: false }` (outros sites exigem permissão concedida).
- Submissão, conta de desenvolvedor (taxa única de US$ 5) e hospedagem da política de privacidade são ações do usuário; este plano não publica nada.

## Review Focus

- Usuário **nega** o pedido de permissão: a caixa volta a desmarcada, nada é salvo como ativo, sem erro (Task 3).
- Usuário **revoga** a permissão em `chrome://extensions` (ou atualiza de uma versão com `otherSites:true` salvo e sem permissão): a opção desliga sozinha e o script dinâmico é removido (Task 3).
- Subdomínios do Pinterest que não são o app (`help.`, `business.`, `developers.`…) não podem ficar meio brancos: caem no motor genérico (Task 4).
- Idioma do navegador diferente de `en`/`pt_BR` cai em inglês; nenhuma chave aparece crua (`__MSG_…__`) (Task 1).
- Zip da loja: sem `key`, sem arquivos de desenvolvimento, todo arquivo referenciado existe, versão coerente (Task 2).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `_locales/en/messages.json`, `_locales/pt_BR/messages.json` | textos do manifest e do popup |
| `scripts/build.js` | gera `dist/extension` + zip da loja e `dist/test` (variante de testes) |
| `src/background.js` | service worker: sincroniza o content script dinâmico |
| `src/settings.js` | + `reconcileOtherSites`, `setOtherSites`, `siteKind`; `save` passa a gravar só o patch |
| `scripts/make-icons.js`, `icons/` | ícones PNG |
| `scripts/store-assets.js` | screenshots e tile promocional em `dist/store/` |
| `docs/store/*` | listagem (en/pt-BR), justificativas de permissão, política de privacidade, checklist de submissão |
| `tests/build.test.js`, `tests/locales.test.js`, `tests/icons.test.js`, `tests/store.test.js` | validações offline |

---

### Task 1: Internacionalização (en + pt_BR) e nome da loja

**Files:**
- Create: `_locales/en/messages.json`, `_locales/pt_BR/messages.json`, `tests/locales.test.js`
- Modify: `manifest.json`, `popup/popup.html`, `popup/popup.js`, `package.json` (script `test`)

**Interfaces:**
- Produces: chaves de mensagem `extName`, `extDescription`, `popupTitle`, `themeLight`, `themeDark`, `themeSepia`, `otherSites`, `otherSitesHint`, `permissionDenied`; no popup, elementos com `data-i18n="<chave>"` recebem o texto e `data-i18n-aria="<chave>"` o `aria-label`.

- [ ] **Step 1: Escrever `tests/locales.test.js`:**

```js
test('existem exatamente os 55 diretórios de _locales da lista oficial')
test('todos os idiomas têm exatamente as mesmas chaves que en; extName é igual em todos')
test('toda extDescription contém "Pinterest" (aviso de não afiliação)')
test('popup: com cada um dos 55 idiomas aplicado (textos + dir), nenhum overflow horizontal em 320px')  // e2e, em tests/e2e/popup-i18n.test.js
test('popup: ar, fa e he recebem dir="rtl"; os demais "ltr"')  // e2e
test('en e pt_BR têm exatamente as mesmas chaves')
test('toda mensagem tem "message" não vazia')
test('extName ≤ 75 e extDescription ≤ 132 caracteres, nos dois idiomas')
test('manifest usa __MSG_extName__ / __MSG_extDescription__ e default_locale "en"')
test('todo data-i18n / data-i18n-aria do popup.html existe nas mensagens')
test('en: extName === "Soft Themes for Pinterest" e extDescription termina com "Not affiliated with Pinterest."')
```

- [ ] **Step 2: Rodar `npm test`** — esperado: FAIL (arquivos inexistentes).
- [ ] **Step 3: Criar os dois `messages.json`** com as chaves acima; pt_BR: "Claro/Escuro/Sépia", "Aplicar em outros sites", `otherSitesHint` = recarregue as abas abertas após ativar, `permissionDenied` = permissão negada, a opção continua desligada; descrição pt_BR termina com "Sem vínculo com o Pinterest." Manifest: `"name":"__MSG_extName__"`, `"description":"__MSG_extDescription__"`, `"default_locale":"en"`, `"version":"1.0.0"`, `"minimum_chrome_version":"111"`; `package.json` com `"version":"1.0.0"` e `test` rodando `tests/*.test.js`.
- [ ] **Step 4: Popup:** substituir textos fixos por `data-i18n`; `popup.js` aplica `chrome.i18n.getMessage` no início; `<html lang>` vem de `chrome.i18n.getUILanguage()`.
- [ ] **Step 5: Rodar `npm test` e `npm run test:e2e`** — esperado: tudo PASS (e2e dos popups usa `button[data-theme]`, não o texto).
- [ ] **Step 6: Commit** — `feat: i18n (en, pt_BR) and store name`.

---

### Task 2: Script de build, pacote da loja e variante de testes

**Files:**
- Create: `scripts/build.js`, `tests/build.test.js`
- Modify: `package.json` (scripts `build`, `build:test`, `package`, `test:e2e`), `tests/e2e/helpers.js`, `.gitignore` (`dist`)

**Interfaces:**
- Produces: `build({ variant: 'store' | 'test', outDir: string }): Promise<{ dir: string, manifest: object }>` exportada de `scripts/build.js` (também CLI: `node scripts/build.js [--test]`).
  - `store`: copia somente `manifest.json`, `_locales/`, `src/` (sem `background` quando ainda não existir), `css/`, `popup/`, `icons/`; remove `key`; grava `dist/soft-themes-for-pinterest-<version>.zip` (via `adm-zip`).
  - `test`: igual, mas **mantém `key`** e acrescenta `host_permissions: ["<all_urls>"]`; saída em `dist/test`.
- `helpers.launch()` passa a carregar `dist/test` (id calculado do `key` como hoje); `test:e2e` = `node scripts/build.js --test && playwright test tests/e2e`.

- [ ] **Step 1: `npm i -D adm-zip`. Escrever `tests/build.test.js`** (usa diretório temporário):

```js
test('store: manifest sem "key"; versão == package.json')
test('store: sem host_permissions; permissions == ["storage","scripting"] ou ["storage"] conforme a Task 3')
test('store: todo arquivo referenciado (js, css, ícones, popup, locales) existe no pacote')
test('store: pacote não contém tests/, docs/, scripts/, node_modules/, .ledger.md nem .git')
test('store: o zip abre e contém o manifest.json na raiz')
test('test: mantém "key" e tem host_permissions ["<all_urls>"]')
```

(Na Task 2 o teste de permissões compara com `["storage"]`; a Task 3 o atualiza para `["storage","scripting"]`.)

- [ ] **Step 2: `npm test`** — esperado: FAIL (`scripts/build.js` inexistente).
- [ ] **Step 3: Implementar `build`** conforme a interface; falha com mensagem clara se um arquivo referenciado no manifest não existir (inclui `_locales/<default_locale>/messages.json`).
- [ ] **Step 4: `npm test && npm run test:e2e`** — esperado: unit PASS; e2e PASS rodando a partir de `dist/test` (mesmos 15 testes).
- [ ] **Step 5: Commit** — `feat: build script, store package and test variant`.

---

### Task 3: Permissões mínimas — Pinterest estático + outros sites sob demanda

**Files:**
- Create: `src/background.js`
- Modify: `manifest.json`, `src/settings.js`, `src/content.js`, `popup/popup.js`, `popup/popup.html` (`#status` com `role="status"`), `scripts/build.js` (copiar `background.js`), `tests/settings.test.js`, `tests/build.test.js`, `tests/e2e/core.test.js`, `tests/e2e/popup.test.js`

**Interfaces:**
- Consumes: `PTSettings.load/save/normalizeSettings/isPinterestHost` (existentes).
- Produces (em `src/settings.js`, também em `PTSettings`):
  - `DEFAULTS = { theme: 'dark', otherSites: false }`
  - `save(patch: Partial<Settings>): Promise<void>` — grava só os campos do patch já normalizados (sem ler-mesclar-escrever; corrige a corrida de cliques rápidos).
  - `reconcileOtherSites(settings: Settings, granted: boolean): { register: boolean, settings: Settings }` — `register = settings.otherSites && granted`; se `otherSites && !granted`, devolve `settings.otherSites = false`.
  - `setOtherSites(enabled: boolean, perms = chrome.permissions): Promise<boolean>` — ativar: `perms.request({ origins: ['<all_urls>'] })`; se negado devolve `false` e não grava; se concedido grava `otherSites:true` e devolve `true`. Desativar: `perms.remove({ origins: ['<all_urls>'] })`, grava `false`, devolve `false`.
- Manifest: `content_scripts[0].matches` = domínios do Pinterest (`*://*.pinterest.com/*` e ccTLDs `co.uk`, `com.au`, `com.mx`, `ca`, `de`, `fr`, `es`, `it`, `jp`, `kr`, `nz`, `ph`, `pt`, `ru`, `se`, `ch`, `at`, `cl`, `dk`, `ie`, `nl`, `id`, `in`, `co`), mesmos `js`/`css` de hoje; `permissions: ["storage","scripting"]`; `optional_host_permissions: ["<all_urls>"]`; `background: { service_worker: "src/background.js" }`.
- `src/background.js` (`importScripts('settings.js')`): `syncOtherSites(): Promise<void>` — lê configurações e `chrome.permissions.contains`, aplica `reconcileOtherSites`, grava se mudou, e registra/desregistra o script dinâmico `pt-other-sites` (`js: ['src/settings.js','src/content.js']`, `css: ['css/tokens.css','css/generic.css']`, `matches: ['<all_urls>']`, `excludeMatches` = matches do manifest, `runAt: 'document_start'`, `persistAcrossSessions: true`). Chamada em `onInstalled`, `onStartup`, `storage.onChanged`, `permissions.onAdded`, `permissions.onRemoved`.

- [ ] **Step 1: Atualizar/escrever testes unitários** em `tests/settings.test.js` (fake de `chrome` injetado por `globalThis.chrome`):

```js
test('DEFAULTS.otherSites é false')
test('save: dois saves concorrentes de campos diferentes preservam ambos')
test('reconcileOtherSites: otherSites true sem permissão => {register:false, settings.otherSites:false}')
test('reconcileOtherSites: otherSites true com permissão => register true')
test('reconcileOtherSites: otherSites false com permissão => register false')
test('setOtherSites(true) com permissão negada devolve false e não grava true')
test('setOtherSites(true) concedida grava true e devolve true')
test('setOtherSites(false) remove a permissão e grava false')
test('manifest: todo match estático é host do Pinterest (isPinterestHost) e não há "<all_urls>" estático')
```

- [ ] **Step 2: `npm test`** — esperado: FAIL.
- [ ] **Step 3: Implementar** as funções em `src/settings.js`; `content.js`: envolver `apply()` em `try/catch` que ignora "Extension context invalidated" (o listener deixa de ser chamado sem lançar); popup: `#other-sites` chama `setOtherSites(checked)` e, se devolver `false` ao ativar, desmarca a caixa e escreve `permissionDenied` em `#status`; ao ativar com sucesso mostra `otherSitesHint` em `#status`.
- [ ] **Step 4: Escrever `src/background.js` e atualizar `manifest.json` e `build.js`; atualizar `tests/build.test.js`** (permissions `["storage","scripting"]`, `optional_host_permissions` presente, sem `host_permissions`, `background.js` no pacote).
- [ ] **Step 5: Adaptar e2e** (variante de testes tem a permissão): em `core.test.js` os testes de outros sites passam a esperar o script dinâmico (`otherSites:true` tema aplicado; `otherSites:false` → fixture sem `data-pt-theme`); em `popup.test.js` o teste da caixa verifica que a aba abre clara após desmarcar. Adicionar:

```js
test('otherSites=true: script dinâmico registrado e fixture temada após navegar')
test('otherSites=false: nova página não recebe data-pt-theme')
test('storage com otherSites:true mas sem permissão (variante store simulada) é corrigido para false')  // via reconcile no unit; aqui só o caminho registrado
```

- [ ] **Step 6: `npm test && npm run test:e2e`** — esperado: tudo PASS.
- [ ] **Step 7: Verificação manual** (Chrome real, pacote `dist/extension`): carregar sem compactação, marcar "Aplicar em outros sites" → aparece o prompt do Chrome; negar → caixa volta desmarcada com a mensagem; aceitar → recarregar uma aba qualquer e ver o tema; remover a permissão em `chrome://extensions` → a opção desliga ao reabrir o popup. Registrar o resultado em `docs/store/SUBMISSION.md`.
- [ ] **Step 8: Commit** — `feat: least-privilege permissions with on-demand other-sites access`.

---

### Task 4: Subdomínios do Pinterest que não são o app

**Files:**
- Modify: `src/settings.js`, `src/content.js`, `tests/settings.test.js`, `tests/e2e/pinterest-live.test.js`, `docs/pinterest-notes.md`

**Interfaces:**
- Produces: `NON_APP_SUBDOMAINS: string[]` e `siteKind(hostname: string): 'pinterest' | 'other'` — `'pinterest'` se `isPinterestHost(hostname)` e o primeiro rótulo não está em `NON_APP_SUBDOMAINS`; `content.js` usa `siteKind` para `data-pt-site`, enquanto `effectiveTheme` continua usando `isPinterestHost` (o domínio inteiro conta como "Pinterest" para a regra `otherSites`).

- [ ] **Step 1: Descoberta (navegador embutido, sem login):** abrir `help.pinterest.com`, `business.pinterest.com`, `developers.pinterest.com`, `policy.pinterest.com`, `newsroom.pinterest.com`; em cada um, ler `getComputedStyle(document.documentElement).getPropertyValue('--sema-color-background-default')`. Os hosts em que vier vazio entram em `NON_APP_SUBDOMAINS`; registrar a tabela em `docs/pinterest-notes.md`.
- [ ] **Step 2: Escrever testes** (`tests/settings.test.js`), com os hosts descobertos no Step 1:

```js
test('siteKind: www.pinterest.com, br.pinterest.com, pinterest.co.uk => "pinterest"')
test('siteKind: cada host de NON_APP_SUBDOMAINS (ex. help.pinterest.com) => "other"')
test('siteKind: example.com => "other"')
test('effectiveTheme: help.pinterest.com com otherSites:false continua devolvendo o tema (domínio Pinterest)')
```

- [ ] **Step 3: `npm test`** — esperado: FAIL. **Step 4:** implementar `siteKind`/`NON_APP_SUBDOMAINS` e usar em `content.js`. **Step 5:** `npm test` — PASS.
- [ ] **Step 6: Teste ao vivo** (`PT_LIVE=1`): `help.pinterest.com` recebe `data-pt-site="other"` e, com `theme:'dark'`, o pixel de uma área de fundo fica cinza cimento (±8 de `#2e2e2e`) — o motor genérico cobre o site. Rodar `PT_LIVE=1 npm run test:e2e -- pinterest-live` — esperado: PASS.
- [ ] **Step 7: Commit** — `feat: generic fallback for non-app pinterest subdomains`.

---

### Task 5: Ícones e materiais gráficos da loja

**Files:**
- Create: `scripts/make-icons.js`, `icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`, `scripts/store-assets.js`, `tests/icons.test.js`
- Modify: `manifest.json` (`icons` e `action.default_icon`), `package.json` (scripts `icons`, `store-assets`)

**Interfaces:**
- Produces: `icons/icon-{16,32,48,128}.png` (RGBA, quadrados); `scripts/store-assets.js` grava em `dist/store/`: `promo-small.png` (440×280), `screenshot-popup.png` (1280×800, popup ampliado centralizado sobre fundo neutro, nos 3 temas lado a lado ou em sequência — implementador decide o layout), e, com `PT_LIVE=1`, `screenshot-pinterest-{light,dark,sepia}.png` (1280×800, busca pública do Pinterest sem login).
- Design do ícone (valores fixos): quadrado arredondado, metade esquerda `#2b2d2f`, metade direita `#f4ecd8`, borda `#d9dadb` de 1/16 do lado; **sem** o logotipo do Pinterest e sem vermelho de marca.

- [ ] **Step 1: Escrever `tests/icons.test.js`:**

```js
test('os 4 ícones existem e o IHDR tem largura==altura==tamanho do nome, 8 bits, RGBA')
test('cada ícone não é uniforme (≥ 3 cores distintas)')
test('o pixel central-esquerdo é #2b2d2f e o central-direito é #f4ecd8 no ícone de 128')
test('manifest.icons e action.default_icon apontam para os 4 arquivos')
```

- [ ] **Step 2: `npm test`** — esperado: FAIL. **Step 3:** implementar `scripts/make-icons.js` (desenho com supersampling 4× e codificação PNG com `zlib`, sem dependências), rodar `npm run icons`, atualizar o manifest. **Step 4:** `npm test` — PASS.
- [ ] **Step 5: `scripts/store-assets.js`** (Playwright + variante `dist/test`). Verificação: `npm run build:test && npm run store-assets` gera `promo-small.png` e `screenshot-popup.png` com as dimensões exatas (checar o IHDR); com `PT_LIVE=1` gera também as 3 capturas do Pinterest. Abrir cada PNG e conferir visualmente (texto legível, sem tema errado).
- [ ] **Step 6: Commit** — `feat: icons and store graphics`.

---

### Task 6: Listagem, privacidade, justificativas e pacote final

**Files:**
- Create: `docs/store/listing.en.md`, `docs/store/listing.pt-BR.md`, `docs/store/permissions.md`, `docs/store/privacy-policy.md`, `docs/store/SUBMISSION.md`, `CHANGELOG.md`, `tests/store.test.js`
- Modify: `README.md`, `package.json` (script `package` = build da loja + zip)

**Interfaces:**
- Consumes: `build({variant:'store'})` (Task 2), ícones e materiais (Task 5).
- Produces: `dist/soft-themes-for-pinterest-1.0.0.zip` pronto para upload; textos prontos para colar nos campos do painel.

- [ ] **Step 1: Escrever `tests/store.test.js`:**

```js
test('listing.en.md e listing.pt-BR.md têm as seções: Name, Short description, Description, Category, Single purpose')
test('Short description de cada listagem ≤ 132 caracteres e igual à extDescription do idioma')
test('permissions.md cita storage, scripting, optional_host_permissions e os domínios estáticos')
test('privacy-policy.md afirma que nenhum dado é coletado ou transmitido e cita chrome.storage.sync, em en e pt-BR')
test('SUBMISSION.md lista os passos manuais (conta de desenvolvedor, upload do zip, URL da política, aba Privacy practices, envio)')
test('CHANGELOG.md tem a entrada 1.0.0')
```

- [ ] **Step 2: `npm test`** — esperado: FAIL.
- [ ] **Step 3: Escrever os documentos.** Listagem: categoria *Productivity*; *Single purpose* = "Apply comfortable dark (cement gray) and sepia color themes to Pinterest, and optionally to other sites"; descrição detalhada com os 3 temas, aviso "Not affiliated with, endorsed by or sponsored by Pinterest", lista de recursos e como ativar outros sites. `permissions.md`: uma justificativa por permissão (`storage`: salvar o tema; `scripting`: registrar o tema nos outros sites quando o usuário ativa; host do Pinterest: aplicar o tema; `optional_host_permissions`: só quando o usuário marca "Aplicar em outros sites"). `privacy-policy.md` (en + pt-BR): nenhum dado coletado, vendido ou transmitido; preferências em `chrome.storage.sync` (sincronizado pelo Google do usuário); contato = e-mail do usuário. `SUBMISSION.md`: checklist manual — criar conta de desenvolvedor, hospedar a política (ex.: GitHub Pages) e colar a URL, enviar o zip, colar listagem/justificativas, marcar na aba *Privacy practices* "não coleta dados do usuário" e as três certificações, anexar materiais de `dist/store/`, enviar para revisão; mais o resultado da verificação manual da Task 3.
- [ ] **Step 4: `npm test`** — esperado: PASS (todos os arquivos `tests/*.test.js`).
- [ ] **Step 5: Pacote final:** `npm run package`. Esperado: `dist/soft-themes-for-pinterest-1.0.0.zip` criado; abrir o zip e conferir (script ou `tests/build.test.js`) que não há `key`, `tests/`, `docs/`; carregar o conteúdo descompactado no Chrome e repetir a verificação manual curta: popup em inglês e em português (mudar o idioma do Chrome ou usar `--lang=pt-BR`), Pinterest nos 3 temas.
- [ ] **Step 6: Atualizar `README.md`** (instalação pela loja, build, testes) e **commit** — `chore: store listing, privacy policy and release package`.

---

## Self-Review

- **Cobertura:** permissões e revisão (Task 3), nome/marca e idiomas (Task 1), pacote limpo e zip (Task 2), ícones e materiais (Task 5), listagem + privacidade + justificativas + checklist (Task 6), subdomínios fora do app (Task 4). Passos que dependem do usuário (conta, hospedagem da política, envio) estão marcados como manuais em *Global Constraints* e na Task 6.
- **Itens adiados da versão anterior incorporados:** corrida de `save` e `try/catch` do `apply()` (Task 3). Continuam fora: cache obsoleto por site, conteúdo em tela cheia/`<dialog>`, teste com `<video>`.
- **Consistência:** `PTSettings.{DEFAULTS,save,reconcileOtherSites,setOtherSites,siteKind,NON_APP_SUBDOMAINS}`, `build({variant,outDir})`, id de script `pt-other-sites` e a lista de matches (fonte única no manifest) aparecem com os mesmos nomes em todas as tasks.
- **Riscos que o plano não elimina:** aprovação da loja é decisão do Google (marca "Pinterest" no nome/descrição e capturas com pins de terceiros podem gerar pedido de ajuste; por isso o nome neutro, o aviso de não afiliação e a captura só de páginas públicas, revisáveis antes do envio); a superfície logada do Pinterest segue sem verificação automática.
