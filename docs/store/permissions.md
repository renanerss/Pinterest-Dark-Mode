# Justificativas de permissão (campo "Permission justification" do painel)

| Permissão | Justificativa (colar no painel, em inglês) |
|---|---|
| `storage` | Saves the user's chosen theme (light, dark or sepia) and the "apply to other sites" switch so they persist and sync across the user's browsers. No other data is stored. |
| `scripting` | Registers the theme content script for other websites, only after the user turns on "Apply to other sites" and grants the permission. It is unregistered when the user turns the option off. |
| Content script em domínios do Pinterest (`pinterest.com`, `pinterest.co.uk`, `pinterest.com.au` e demais domínios regionais listados no manifest) | The single purpose of the extension: applying the dark and sepia color themes to Pinterest pages. The script only sets a theme attribute on the page and applies local CSS; it never reads, collects or transmits page content. |
| `optional_host_permissions` (`<all_urls>`) | Optional. Requested at runtime, with Chrome's own prompt, only when the user ticks "Apply to other sites" so the same themes can be applied to websites the user visits. Not requested at install, and removed when the user unticks the option. |

**Uso de código remoto:** nenhum. **Coleta de dados:** nenhuma (marcar "não coleta" e as três certificações na aba *Privacy practices*).
