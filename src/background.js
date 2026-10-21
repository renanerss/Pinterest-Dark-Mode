importScripts('settings.js');

const SCRIPT_ID = 'pt-other-sites';
const ALL_SITES = { origins: ['<all_urls>'] };

// Registra/remove o content script dos "outros sites" conforme a opção e a permissão concedida.
async function syncOtherSites() {
  const settings = await PTSettings.load();
  const granted = await chrome.permissions.contains(ALL_SITES);
  const { register, settings: next } = PTSettings.reconcileOtherSites(settings, granted);
  if (next.otherSites !== settings.otherSites) await PTSettings.save({ otherSites: next.otherSites });

  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (register && existing.length === 0) {
    await chrome.scripting.registerContentScripts([{
      id: SCRIPT_ID,
      matches: ['<all_urls>'],
      excludeMatches: chrome.runtime.getManifest().content_scripts.flatMap((c) => c.matches),
      js: ['src/settings.js', 'src/content.js'],
      css: ['css/tokens.css', 'css/generic.css'],
      runAt: 'document_start',
      persistAcrossSessions: true,
    }]);
  } else if (!register && existing.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
}

// Serializa as chamadas: eventos em rajada não registram o mesmo id duas vezes.
let queue = Promise.resolve();
function scheduleSync() {
  queue = queue.then(syncOtherSites).catch((e) => console.warn('syncOtherSites falhou', e));
  return queue;
}

chrome.runtime.onInstalled.addListener(scheduleSync);
chrome.runtime.onStartup.addListener(scheduleSync);
chrome.storage.onChanged.addListener(scheduleSync);
chrome.permissions.onAdded.addListener(scheduleSync);
chrome.permissions.onRemoved.addListener(scheduleSync);
