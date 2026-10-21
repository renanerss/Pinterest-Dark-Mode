(function () {
  const { load, effectiveTheme, siteKind, THEME_IDS } = PTSettings;
  const root = document.documentElement;
  const CACHE_KEY = '__pt_theme';

  function setAttrs(site, theme) {
    root.setAttribute('data-pt-site', site);
    root.setAttribute('data-pt-theme', theme);
  }

  // Aplica de forma síncrona o último tema resolvido neste site, evitando o flash claro.
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (THEME_IDS.includes(cached)) setAttrs(siteKind(location.hostname), cached);
  } catch (e) { /* storage bloqueado: segue sem cache */ }

  async function apply() {
    try {
      const settings = await load();
      const host = location.hostname;
      const theme = effectiveTheme(settings, host);
      setAttrs(siteKind(host), theme);
      try { localStorage.setItem(CACHE_KEY, theme); } catch (e) { /* ignora */ }
    } catch (e) { /* extensão recarregada/atualizada: o contexto deste script foi invalidado */ }
  }

  apply();
  chrome.storage.onChanged.addListener(apply);
})();
