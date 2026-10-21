(async function () {
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
  other.addEventListener('change', async () => {
    await PTSettings.save({ otherSites: other.checked });
    render(await PTSettings.load());
  });
})();
