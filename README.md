# Pinterest Comfort Themes

Extensão Chrome com três temas, otimizada para o Pinterest:

- **Claro** — o site original.
- **Escuro** — cinza cimento (`#2b2d2f`), nunca preto puro.
- **Sépia** — papel quente (`#f4ecd8`) com texto marrom.

Funciona também em outros sites (filtro genérico); dá para desligar no popup em "Aplicar em outros sites".

## Instalar

1. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e escolha esta pasta.
3. Fixe a extensão na barra e escolha o tema no popup. A mudança vale nas abas abertas, sem recarregar.

## Testes

```bash
npm install
npx playwright install chromium
npm test              # unitários
npm run test:e2e      # e2e com a extensão carregada
PT_LIVE=1 npm run test:e2e -- pinterest-live   # contra pinterest.com (requer rede)
```

Detalhes de como o Pinterest é tematizado: [docs/pinterest-notes.md](docs/pinterest-notes.md).
