chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url.includes("youtube.com/shorts")) {
      chrome.tabs.update(tab.id, { url: tab.url.replace("shorts", "watch") });
    }
  }
});