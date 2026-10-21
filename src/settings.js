(function (root) {
  const THEME_IDS = ['light', 'dark', 'sepia'];
  const DEFAULTS = { theme: 'dark', otherSites: false };
  const PINTEREST_RE = /(^|\.)pinterest\.([a-z]{2,3}|(com|co)\.[a-z]{2})$/;
  const ALL_SITES = { origins: ['<all_urls>'] };

  function normalizeSettings(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    return {
      theme: THEME_IDS.includes(r.theme) ? r.theme : DEFAULTS.theme,
      otherSites: typeof r.otherSites === 'boolean' ? r.otherSites : DEFAULTS.otherSites,
    };
  }

  function isPinterestHost(hostname) {
    return PINTEREST_RE.test(String(hostname).toLowerCase());
  }

  function effectiveTheme(settings, hostname) {
    const s = normalizeSettings(settings);
    if (!isPinterestHost(hostname) && !s.otherSites) return 'light';
    return s.theme;
  }

  // "Outros sites" só vale com a permissão concedida; sem ela a opção é desligada.
  function reconcileOtherSites(settings, granted) {
    const s = normalizeSettings(settings);
    const enabled = s.otherSites && Boolean(granted);
    return { register: enabled, settings: { ...s, otherSites: enabled } };
  }

  async function load() {
    const raw = await chrome.storage.sync.get(null);
    return normalizeSettings(raw);
  }

  // Grava só os campos válidos do patch (sem ler-mesclar-escrever), evitando corrida entre saves.
  async function save(patch) {
    const p = patch && typeof patch === 'object' ? patch : {};
    const clean = {};
    if (THEME_IDS.includes(p.theme)) clean.theme = p.theme;
    if (typeof p.otherSites === 'boolean') clean.otherSites = p.otherSites;
    if (Object.keys(clean).length) await chrome.storage.sync.set(clean);
  }

  // Ativar pede a permissão ao usuário (precisa de gesto); desativar devolve a permissão.
  async function setOtherSites(enabled, perms = chrome.permissions) {
    if (enabled) {
      if (!(await perms.request(ALL_SITES))) return false;
      await save({ otherSites: true });
      return true;
    }
    try { await perms.remove(ALL_SITES); } catch (e) { /* permissão obrigatória (build de testes): ignora */ }
    await save({ otherSites: false });
    return false;
  }

  const api = { THEME_IDS, DEFAULTS, normalizeSettings, isPinterestHost, effectiveTheme, reconcileOtherSites, load, save, setOtherSites };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PTSettings = api;
})(globalThis);
