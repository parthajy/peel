/* Peel service worker: badge + local screenshots for the page flip. Nothing leaves the browser. */
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || !sender.tab) return;
  if (msg.type === 'peel:state') {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: msg.active ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#ff5e3a' });
  }
  if (msg.type === 'peel:capture') {
    // A JPEG of the visible tab, handed straight back to the page that asked. Used only to animate the flip.
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'jpeg', quality: 72 }, (dataUrl) => {
      reply({ dataUrl: chrome.runtime.lastError ? null : dataUrl, error: chrome.runtime.lastError && chrome.runtime.lastError.message });
    });
    return true;
  }
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['prefs'], (o) => { if (!o.prefs) chrome.storage.sync.set({ prefs: { fab: true, motion: true, sound: false, quips: true } }); });
});
