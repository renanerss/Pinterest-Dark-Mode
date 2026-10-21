# Desenvolvimento

## Rodar localmente

```bash
npm install
npx playwright install chromium
npm run build        # dist/extension (pacote da loja) + dist/soft-themes-for-pinterest-<versão>.zip
```

Em `chrome://extensions` (Modo do desenvolvedor) → *Carregar sem compactação* → `dist/extension`.

## Testes

```bash
npm test                                        # unitários e validações de pacote, idiomas, README e loja
npm run test:e2e                                # e2e com a extensão carregada no Chromium (reconstrói dist/)
PT_LIVE=1 npm run test:e2e -- pinterest-live    # contra pinterest.com e subdomínios (requer rede)
```

## Publicar uma nova versão

1. Subir `version` em `manifest.json` e `package.json` (devem coincidir) e atualizar o `CHANGELOG.md`.
2. Atualizar o link do zip nos dois READMEs (`releases/soft-themes-for-pinterest-<versão>.zip`).
3. `npm test && npm run test:e2e && npm run release`: gera o zip e o copia para `releases/`. O teste `tests/readme.test.js` falha se o zip em `releases/` estiver defasado em relação ao código.
4. Commit e push. Para a Chrome Web Store, siga [store/SUBMISSION.md](store/SUBMISSION.md).

## Estrutura

| Pasta/arquivo | O quê |
|---|---|
| `manifest.json`, `_locales/` | manifest MV3 e as 55 línguas |
| `src/` | `settings.js` (lógica), `content.js`, `background.js` (service worker) |
| `css/` | `tokens.css`, `generic.css` (outros sites), `pinterest.css` (camada do Pinterest) |
| `popup/` | seletor de tema |
| `scripts/` | `build.js`, `make-icons.js`, `store-assets.js`, `release.js` |
| `tests/` | unitários (`node:test`) e `e2e/` (Playwright) |
| `docs/` | notas do Pinterest, design system, material da loja, planos |

Mais: [pinterest-notes.md](pinterest-notes.md) (como o Pinterest é tematizado), [design/DESIGN-cohere.md](design/DESIGN-cohere.md) (design system do popup).
