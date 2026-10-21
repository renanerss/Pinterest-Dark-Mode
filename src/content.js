(function () {
  const { load, effectiveTheme, isPinterestHost, THEME_IDS } = PTSettings;
  const root = document.documentElement;
  const CACHE_KEY = '__pt_theme';

  function setAttrs(site, theme) {
    root.setAttribute('data-pt-site', site);
    root.setAttribute('data-pt-theme', theme);
  }

  // Aplica de forma síncrona o último tema resolvido neste site, evitando o flash claro.
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (THEME_IDS.includes(cached)) setAttrs(isPinterestHost(location.hostname) ? 'pinterest' : 'other', cached);
  } catch (e) { /* storage bloqueado: segue sem cache */ }

  async function apply() {
    const settings = await load();
    const host = location.hostname;
    const theme = effectiveTheme(settings, host);
    setAttrs(isPinterestHost(host) ? 'pinterest' : 'other', theme);
    try { localStorage.setItem(CACHE_KEY, theme); } catch (e) { /* ignora */ }
  }

  apply();
  chrome.storage.onChanged.addListener(apply);
})();
