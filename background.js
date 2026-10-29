const RULESET_ID = "shorts_to_watch";

const ICONS = {
  enabled: {
    16: "icons/icon16.png",
    32: "icons/icon32.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
  disabled: {
    16: "icons/icon16NA.png",
    32: "icons/icon32NA.png",
    48: "icons/icon48NA.png",
    128: "icons/icon128NA.png",
  },
};

function logError(context) {
  return (error) => console.error(`View Switcher: ${context}`, error);
}

async function readIsEnabled() {
  const { isEnabled } = await chrome.storage.sync.get("isEnabled");
  return isEnabled !== false;
}

// Neither the enabled ruleset nor the toolbar icon is guaranteed to survive browser
// restarts and extension updates, so both are re-derived from storage.
async function applyState(isEnabled) {
  const rulesetUpdate = isEnabled
    ? { enableRulesetIds: [RULESET_ID] }
    : { disableRulesetIds: [RULESET_ID] };
  await Promise.all([
    chrome.declarativeNetRequest.updateEnabledRulesets(rulesetUpdate),
    chrome.action.setIcon({ path: isEnabled ? ICONS.enabled : ICONS.disabled }),
  ]);
}

async function syncFromStorage() {
  await applyState(await readIsEnabled());
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  // Only set the default on a fresh install; updates keep the user's choice.
  const setDefault =
    reason === chrome.runtime.OnInstalledReason.INSTALL
      ? chrome.storage.sync.set({ isEnabled: true })
      : Promise.resolve();
  setDefault.then(syncFromStorage).catch(logError("could not initialise after install/update"));
});

chrome.runtime.onStartup.addListener(() => {
  syncFromStorage().catch(logError("could not restore state on startup"));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !("isEnabled" in changes)) {
    return;
  }
  applyState(changes.isEnabled.newValue !== false).catch(logError("could not apply new state"));
});
