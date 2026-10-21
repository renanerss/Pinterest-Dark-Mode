# Modo Escuro do Pinterest — Soft Themes for Pinterest (extensão do Chrome)

🌐 [Site](https://renanerss.github.io/Pinterest-Dark-Mode/pt-br/) · 🇺🇸 [Read in English](README.md)

![Soft Themes for Pinterest](docs/images/promo.png)

**Modo escuro do Pinterest** suave para os olhos. O Pinterest é claro demais; esta extensão gratuita do Chrome adiciona um tema escuro e um tema sépia, trocados com um clique:

- **Escuro**: fundo **cinza cimento** suave (nunca preto puro), com bom contraste.
- **Sépia**: um tom de papel quente para sessões longas.
- **Claro**: o Pinterest original.

Seus pins mantêm as cores originais: os temas mudam a página, nunca as fotos.

![Seletor de tema](docs/images/popup.png)

## Instalar (pelo .zip)

O Chrome não instala um `.zip` direto: você descompacta uma vez e carrega a pasta. Leva cerca de um minuto.

1. **[Baixe o .zip](https://github.com/renanerss/Pinterest-Dark-Mode/raw/main/releases/soft-themes-for-pinterest-1.0.0.zip)**.
2. **Descompacte** numa pasta que você vai manter (por exemplo `Documentos/soft-themes-for-pinterest`). O Chrome carrega a extensão dessa pasta, então não a apague depois. O arquivo `manifest.json` deve estar direto dentro dela.
3. Abra `chrome://extensions` e ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta do passo 2.
5. Clique no ícone de quebra-cabeça da barra e **fixe** a extensão. Escolha um tema.

Abas do Pinterest que já estavam abertas precisam de um F5 na primeira vez.

**Atualizar:** baixe o novo `.zip`, descompacte por cima da mesma pasta e clique no ícone de recarregar no cartão da extensão em `chrome://extensions`.

### O Windows Defender diz que o .zip é uma ameaça?

Algumas versões do Windows Defender sinalizaram este download como `Trojan:Script/Ulthar.A!ml`. O sufixo `!ml` indica um *palpite* de aprendizado de máquina, não uma assinatura de malware conhecido, e aqui é um **falso positivo**: a extensão não faz requisições de rede, não tem código ofuscado e todo o código-fonte está neste repositório. O .zip atual passou limpo no Defender do PC do mantenedor, mas as heurísticas mudam com o tempo.

Você mesmo pode conferir:

- **Compare o hash.** No PowerShell: `Get-FileHash .soft-themes-for-pinterest-1.0.0.zip -Algorithm SHA256`. Ele deve ser igual ao de [releases/SHA256.txt](releases/SHA256.txt) (`92c555783a4a8732f487c1bca529ce2beb621528832f81696e2de52b96ac97bb`).
- **Leia o código.** É pequeno, JavaScript e CSS simples, e pode ser navegado aqui mesmo no GitHub.
- **Reporte o falso positivo** à Microsoft para a detecção ser corrigida: https://www.microsoft.com/en-us/wdsi/filesubmission

Se o hash não bater, não instale e [abra uma issue](https://github.com/renanerss/Pinterest-Dark-Mode/issues).

Funciona no Chrome e em navegadores baseados em Chromium (confirmado no Brave; Edge e outros devem funcionar do mesmo jeito, usando `edge://extensions`).

## Como usar

- Clique no ícone da barra e escolha **Claro**, **Escuro** ou **Sépia**. As abas abertas atualizam na hora.
- **Aplicar em outros sites** (opcional, desligado por padrão): aplica o mesmo visual a outros sites. O navegador pede permissão quando você liga, e a permissão é removida quando você desliga.
- A interface vem em **55 idiomas** e segue automaticamente o idioma do navegador.

## Privacidade

Nenhum dado é coletado, vendido ou enviado a lugar nenhum. Suas escolhas ficam em `chrome.storage.sync` (sincronizado pela sua própria conta Google, se você usa a sincronização do Chrome). Sem análises, sem anúncios, sem código remoto. Detalhes: [política de privacidade](docs/store/privacy-policy.md).

## Perguntas frequentes

**Por que "Aplicar em outros sites" pede permissão?** Porque precisa de acesso aos sites que você visita para mudar as cores deles. A extensão não pede isso na instalação; só pede se você ligar a opção.

**O Pinterest ficou estranho em alguma página.** O Pinterest muda o site com frequência. [Abra uma issue](https://github.com/renanerss/Pinterest-Dark-Mode/issues) dizendo qual página e qual tema (uma captura de tela ajuda).

**Está na Chrome Web Store?** Ainda não. Até lá, use os passos de instalação acima.

## Apoie o projeto

A extensão é gratuita e independente. Se ela deixa o Pinterest mais agradável para você, pode [me pagar um café](https://buymeacoffee.com/renanerslif) ☕. É opcional e sempre bem-vindo.

## Aviso

Sem vínculo, aprovação ou patrocínio do Pinterest. Pinterest é marca registrada da Pinterest, Inc.

## Para desenvolvedores

Build, testes e publicação: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Histórico de versões: [CHANGELOG.md](CHANGELOG.md).
