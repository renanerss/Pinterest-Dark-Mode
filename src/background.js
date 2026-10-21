importScripts('settings.js');

const SCRIPT_ID = 'pt-other-sites';
const ALL_SITES = { origins: ['<all_urls>'] };

// Definição desejada do script dos "outros sites". Inclui pinterest.css: um domínio regional do Pinterest que não
// está na lista do manifest cai aqui e precisa da camada do Pinterest (data-pt-site="pinterest").
function desiredRegistration() {
  return {
    id: SCRIPT_ID,
    matches: ['<all_urls>'],
    excludeMatches: chrome.runtime.getManifest().content_scripts.flatMap((c) => c.matches),
    js: ['src/settings.js', 'src/content.js'],
    css: ['css/tokens.css', 'css/generic.css', 'css/pinterest.css'],
    runAt: 'document_start',
    persistAcrossSessions: true,
  };
}

const sameRegistration = (a, b) => ['matches', 'excludeMatches', 'js', 'css', 'runAt'].every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));

// Registra/atualiza/remove o content script dos "outros sites" conforme a opção e a permissão concedida.
async function syncOtherSites() {
  const settings = await PTSettings.load();
  const granted = await chrome.permissions.contains(ALL_SITES);
  const { register, settings: next } = PTSettings.reconcileOtherSites(settings, granted);
  if (next.otherSites !== settings.otherSites) await PTSettings.save({ otherSites: next.otherSites });

  const [existing] = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  const desired = desiredRegistration();
  if (register && !existing) {
    await chrome.scripting.registerContentScripts([desired]);
  } else if (register && !sameRegistration(existing, desired)) {
    // registro deixado por uma versão anterior (o registro persiste entre sessões e atualizações)
    await chrome.scripting.updateContentScripts([desired]);
  } else if (!register && existing) {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
}

// Serializa as chamadas: eventos em rajada não registram o mesmo id duas vezes.
let queue = Promise.resolve();
function scheduleSync() {
  queue = queue.then(syncOtherSites).catch((e) => console.warn('syncOtherSites falhou', e));
  return queue;
}

// Permissão concedida enquanto o popup fechou (o prompt do Chrome pode tirar o foco do popup): a opção acompanha.
chrome.permissions.onAdded.addListener((added) => {
  const patch = PTSettings.permissionPatch(added);
  queue = queue.then(() => PTSettings.save(patch)).catch((e) => console.warn('permissionPatch falhou', e));
  return scheduleSync();
});

chrome.runtime.onInstalled.addListener(scheduleSync);
chrome.runtime.onStartup.addListener(scheduleSync);
chrome.storage.onChanged.addListener(scheduleSync);
chrome.permissions.onRemoved.addListener(scheduleSync);
