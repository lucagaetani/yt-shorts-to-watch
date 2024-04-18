chrome.runtime.onInstalled.addListener(() => {
  //Set the default state when the extension is installed
  chrome.storage.sync.set({ isEnabled: true });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com/shorts")) {
    chrome.storage.sync.get(['isEnabled'], function(data) {
      if (data.isEnabled) {
        const newUrl = tab.url.replace("shorts", "watch");
        chrome.tabs.update(tab.id, { url: newUrl });
      }
    });
  }
});