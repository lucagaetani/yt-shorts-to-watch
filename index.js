document.addEventListener('DOMContentLoaded', () => {
  const checkBox = document.querySelector('input[type="checkbox"]');
  const description = document.querySelector('.description');

  // Load the current state of the checkbox
  chrome.storage.sync.get(['isEnabled'], (data) => {
    checkBox.checked = data.isEnabled;
    updateDescription(checkBox.checked);
  });

  // Update the state when the checkbox is changed
  checkBox.addEventListener('change', () => {
    chrome.storage.sync.set({ isEnabled: checkBox.checked });
    updateDescription(checkBox.checked);
    let newIconsPath = checkBox.checked ? {
      "16" : "../icons/icon16.png",
      "32" : "../icons/icon32.png",
      "48" : "../icons/icon48.png",
      "128" : "../icons/icon128.png",
    } : {
      "16" : "../icons/icon16NA.png",
      "32" : "../icons/icon32NA.png",
      "48" : "../icons/icon48NA.png",
      "128" : "../icons/icon128NA.png",
    };
    chrome.action.setIcon({ path: newIconsPath });
  });

  const updateDescription = (isEnabled) => {
    const activatedText = "This extension is currently working. It will automatically change every YouTube Shorts into a normal YouTube video.";
    const notActivatedText = "This extension is not currently working. Reactivate it to change every YouTube Shorts into a normal YouTube video.";
    description.textContent = isEnabled ? activatedText : notActivatedText;
  }
});