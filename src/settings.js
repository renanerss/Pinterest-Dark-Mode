(function (root) {
  const THEME_IDS = ['light', 'dark', 'sepia'];
  const DEFAULTS = { theme: 'dark', otherSites: true };
  const PINTEREST_RE = /(^|\.)pinterest\.([a-z]{2,3}|(com|co)\.[a-z]{2})$/;

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

  async function load() {
    const raw = await chrome.storage.sync.get(null);
    return normalizeSettings(raw);
  }

  async function save(patch) {
    const next = normalizeSettings({ ...(await load()), ...patch });
    await chrome.storage.sync.set(next);
  }

  const api = { THEME_IDS, DEFAULTS, normalizeSettings, isPinterestHost, effectiveTheme, load, save };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PTSettings = api;
})(globalThis);
