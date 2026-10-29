document.addEventListener("DOMContentLoaded", async () => {
  const checkBox = document.getElementById("enabled");
  const description = document.getElementById("status");

  const updateDescription = (isEnabled) => {
    const activatedText = "This extension is currently working. Every YouTube Short opens instantly as a normal YouTube video.";
    const notActivatedText = "This extension is not currently working. Reactivate it to open every YouTube Shorts as a normal YouTube video.";
    description.textContent = isEnabled ? activatedText : notActivatedText;
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
      description.textContent = "Your change could not be saved. Please try again.";
    }
  });

  try {
    const { isEnabled } = await chrome.storage.sync.get("isEnabled");
    checkBox.checked = isEnabled !== false;
    updateDescription(checkBox.checked);
    checkBox.disabled = false;
  } catch (error) {
    console.error("View Switcher: could not load setting", error);
    description.textContent = "Your setting could not be loaded. Close and reopen this popup to try again.";
  } finally {
    // Force a style flush so the initial state is painted before transitions are re-enabled.
    void checkBox.offsetWidth;
    document.body.classList.remove("is-loading");
  }
});
