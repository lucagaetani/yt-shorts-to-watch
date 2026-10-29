const t = (key) => chrome.i18n.getMessage(key);

// Strings live in _locales/<locale>/messages.json; Chrome picks the browser's language
// and falls back to English (default_locale). lang/dir come from the chosen translation.
function localizePage() {
  document.documentElement.lang = t("htmlLang");
  document.documentElement.dir = t("htmlDir");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const checkBox = document.getElementById("enabled");
  const description = document.getElementById("status");

  localizePage();

  const updateDescription = (isEnabled) => {
    description.textContent = t(isEnabled ? "statusEnabled" : "statusDisabled");
  };

  // The service worker and content scripts react to this storage change
  // (icon, redirect rule, and switching a Short that is already open).
  checkBox.addEventListener("change", async () => {
    const isEnabled = checkBox.checked;
    updateDescription(isEnabled);
    try {
      await chrome.storage.sync.set({ isEnabled });
    } catch (error) {
      console.error("View Switcher: could not save setting", error);
      checkBox.checked = !isEnabled;
      description.textContent = t("saveError");
    }
  });

  try {
    const { isEnabled } = await chrome.storage.sync.get("isEnabled");
    checkBox.checked = isEnabled !== false;
    updateDescription(checkBox.checked);
    checkBox.disabled = false;
  } catch (error) {
    console.error("View Switcher: could not load setting", error);
    description.textContent = t("loadError");
  } finally {
    // Force a style flush so the initial state is painted before transitions are re-enabled.
    void checkBox.offsetWidth;
    document.body.classList.remove("is-loading");
  }
});
