# Soft Themes for Pinterest

Extensão Chrome com três temas, otimizada para o Pinterest:

- **Claro** — o site original.
- **Escuro** — cinza cimento (`#2b2d2f`), nunca preto puro.
- **Sépia** — papel quente (`#f4ecd8`) com texto marrom.

"Aplicar em outros sites" é opcional: o Chrome pede a permissão só quando você marca a caixa. A interface vem em 55 idiomas e segue o idioma do navegador.

## Instalar (desenvolvimento)

```bash
npm install
npm run build        # gera dist/extension e o zip da loja
```

1. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. **Carregar sem compactação** → escolha `dist/extension`.
3. Fixe a extensão na barra e escolha o tema no popup. A mudança vale nas abas abertas, sem recarregar (abas abertas *antes* de instalar a extensão precisam de F5).

## Testes

```bash
npm test                                        # unitários e validações de pacote/idiomas/loja
npm run test:e2e                                # e2e com a extensão carregada no Chromium
PT_LIVE=1 npm run test:e2e -- pinterest-live    # contra pinterest.com (requer rede)
```

## Chrome Web Store

`npm run package` gera `dist/soft-themes-for-pinterest-<versão>.zip` (sem `key`, sem arquivos de desenvolvimento). Materiais gráficos: `PT_LIVE=1 npm run store-assets`. Textos, política de privacidade e o passo a passo do envio estão em [docs/store/](docs/store/SUBMISSION.md).

## Documentação

- [docs/pinterest-notes.md](docs/pinterest-notes.md): como o Pinterest é tematizado e o que foi verificado.
- [docs/design/DESIGN-cohere.md](docs/design/DESIGN-cohere.md): design system usado no popup e nos materiais.
- [CHANGELOG.md](CHANGELOG.md)
