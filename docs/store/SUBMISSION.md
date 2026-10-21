# Checklist de submissão — Chrome Web Store

Tudo aqui é feito por você: criar a conta, hospedar a política e enviar para revisão são ações externas que eu não executo.

## 0. Gerar o pacote e os materiais

```bash
npm install
npm run test:e2e          # também gera dist/extension e dist/test
npm run package           # dist/extension + dist/soft-themes-for-pinterest-1.0.0.zip
PT_LIVE=1 npm run store-assets   # dist/store/: promo-small.png, screenshot-popup.png, screenshot-pinterest-*.png
```

## 1. Verificações manuais antes de enviar (Chrome real)

Carregue `dist/extension` em `chrome://extensions` → Modo do desenvolvedor → *Carregar sem compactação*.

- [ ] Pinterest logado, nos 3 temas: feed, pin aberto, boards, perfil, busca, vídeo-pin, modal de salvar. Nada branco ou ilegível; fotos com as cores originais.
- [ ] Marcar "Aplicar em outros sites": **o Chrome mostra o pedido de permissão**. Negar: a caixa volta desmarcada com a mensagem. Aceitar: abrir uma aba de outro site (após recarregar) e ver o tema.
- [ ] Marcar "Aplicar em outros sites" e, enquanto o pedido de permissão está aberto, clicar fora (o popup fecha): aceitar o pedido mesmo assim e confirmar que a opção aparece marcada ao reabrir o popup e que o tema vale nas abas novas.
- [ ] Remover a permissão em `chrome://extensions` → Detalhes → Acesso ao site: ao reabrir o popup a caixa está desmarcada.
- [ ] Mudar o idioma do Chrome (ou iniciar com `--lang=de`, `--lang=ar`) e conferir o popup (árabe/hebraico/persa espelhados).
- [ ] Revisar as capturas `screenshot-pinterest-*.png`: elas mostram pins de terceiros e a interface do Pinterest. Troque por capturas suas se preferir.
- [ ] As traduções dos 54 idiomas não‑inglês foram escritas por mim, sem revisão nativa. Peça revisão de pelo menos os idiomas que você pretende divulgar.

## 2. Preparar o repositório e a política de privacidade

- [ ] Fazer `git push` do projeto para `https://github.com/renanerss/Pinterest-Dark-Mode` (o `origin` já está configurado; **nenhum push foi feito**).
- [ ] Se o repositório for público: *Settings → Pages → Deploy from a branch → `master` / `/docs`*. A política ficará em algo como `https://renanerss.github.io/Pinterest-Dark-Mode/store/privacy-policy` (confira a URL final no navegador).
- [ ] Repositório privado não publica Pages gratuito: hospede `docs/store/privacy-policy.md` em outro lugar público.

## 3. Painel do desenvolvedor

1. Criar a **conta de desenvolvedor** em https://chrome.google.com/webstore/devconsole (taxa única de US$ 5, verificação de e-mail e, às vezes, de identidade).
2. *Add new item* → enviar o **zip** `dist/soft-themes-for-pinterest-1.0.0.zip`.
3. **Store listing:** colar nome, descrição curta e descrição de `docs/store/listing.en.md` (idioma padrão) e, em *Add language*, `listing.pt-BR.md`; os demais idiomas usam a descrição curta do manifest (traduzida) e podem ganhar texto longo depois. Categoria: Productivity. Enviar `promo-small.png` (440×280) e 1–5 capturas (1280×800).
4. **Privacy practices:** *Single purpose* de `listing.en.md`; justificativas de permissão de `permissions.md`; declarar que **não coleta dados do usuário**, marcar as três certificações; informar a URL da **política de privacidade**.
5. **Distribution:** escolher visibilidade (pública ou não listada) e regiões.
6. **enviar para revisão.** O primeiro envio leva de dias a algumas semanas; a revisão pode pedir ajustes (marca "Pinterest" no texto e capturas com pins de terceiros são os pontos mais prováveis).

## 4. Depois de publicar

- [ ] Anotar o ID definitivo da loja; ele **não** é o ID de desenvolvimento (o pacote da loja não leva `key`).
- [ ] Para atualizar: subir a versão em `manifest.json` e `package.json` (devem coincidir), atualizar o `CHANGELOG.md`, rodar `npm run test:e2e && npm run package` e enviar o novo zip.
