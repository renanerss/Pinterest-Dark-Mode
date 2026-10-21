const RTL_LOCALES = ['ar', 'fa', 'he'];

// Applies texts, direction and language. getMessage(key) returns the translated string ('' if missing).
function applyI18n(getMessage, uiLanguage) {
  const lang = String(uiLanguage || 'en');
  const html = document.documentElement;
  html.lang = lang;
  html.dir = RTL_LOCALES.includes(lang.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const msg = getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const msg = getMessage(el.dataset.i18nAria);
    if (msg) el.setAttribute('aria-label', msg);
  });
}

window.PTPopup = { applyI18n };

(async function () {
  applyI18n((k) => chrome.i18n.getMessage(k), chrome.i18n.getUILanguage());

  const buttons = [...document.querySelectorAll('button[data-theme]')];
  const other = document.getElementById('other-sites');

  function render(s) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === s.theme)));
    other.checked = s.otherSites;
  }

  render(await PTSettings.load());
  buttons.forEach((b) => b.addEventListener('click', async () => {
    await PTSettings.save({ theme: b.dataset.theme });
    render(await PTSettings.load());
  }));
  const status = document.getElementById('status');
  other.addEventListener('change', async () => {
    const wanted = other.checked;
    const enabled = await PTSettings.setOtherSites(wanted);
    other.checked = enabled;
    status.textContent = enabled ? chrome.i18n.getMessage('otherSitesHint') : (wanted ? chrome.i18n.getMessage('permissionDenied') : '');
  });
})();
