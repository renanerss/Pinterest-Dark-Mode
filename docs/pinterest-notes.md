# Notas do Pinterest

Descoberta feita em 2026-10-20 (br.pinterest.com, sem login).

## Como o site define cores

- O design system do Pinterest declara ~400 variáveis `--sema-color-*` no `:root` (`background`, `text`, `icon`, `border`, mais variantes `hover-*` e `pressed-*`).
- Variantes `-light`, `-dark` e `-inverse` marcadas como fixas (ex.: `text-light` #fff, `background-dark` #000) **não** são redefinidas: servem a componentes que ficam sobre imagens ou botões escuros.
- Não há `data-test-id` ou atributo de tema escuro nativo.

## Decisão

As variáveis cobrem as superfícies verificadas (cabeçalho, grade de pins, modal de login, campos, botões, chips de filtro), então o Pinterest usa **camada própria** (`css/pinterest.css`): redefine as variáveis semânticas a partir dos tokens `--pt-*` (`css/tokens.css`) com `color-mix` para hover/pressed e estados fracos. Nenhum filtro é aplicado, então as imagens dos pins ficam intactas. O filtro genérico (`css/generic.css`) fica excluído do Pinterest via `:not([data-pt-site="pinterest"])`.

## Verificação

- Automática (`PT_LIVE=1 npm run test:e2e -- pinterest-live`): `data-pt-site`, fundo computado e pixel da superfície do modal nos temas Escuro (`#2b2d2f`) e Sépia (`#f4ecd8`) — passou.
- Visual (Chromium com a extensão, página de busca deslogada, modal de login): ambos os temas legíveis, imagens com as cores originais, botão vermelho de marca preservado.
- **Não verificado:** feed logado, pin aberto, boards, perfil, vídeo-pin e modal de salvar (exigem login). Se alguma superfície ficar branca/ilegível, localizar a variável `--sema-color-*` responsável e mapeá-la em `css/pinterest.css`.
