# Changelog

## 1.0.0 — 2026-10-20

Primeira versão para a Chrome Web Store.

- Temas Claro, Escuro (cinza cimento) e Sépia, com camada própria para o Pinterest e motor genérico para outros sites.
- "Aplicar em outros sites" opcional, via permissão pedida em tempo de execução (nenhuma permissão ampla na instalação).
- Interface em 55 idiomas (seguindo o idioma do navegador), com suporte a escrita da direita para a esquerda.
- Popup no estilo do design system Cohere.
- Subdomínios institucionais do Pinterest (`help.`, `policy.`, `business.`, `developers.`, `newsroom.`) usam o motor genérico.

Limitações conhecidas: se o tema for trocado enquanto um site não está aberto, a visita seguinte pode mostrar o tema antigo por um instante antes de corrigir (cache por site); conteúdo em tela cheia e `<dialog>` não recebe o tema genérico.
