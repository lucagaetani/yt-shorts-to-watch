document.addEventListener('DOMContentLoaded', function() {
  const checkBox = document.querySelector('input[type="checkbox"]');
  const description = document.querySelector('.description');
  const activatedText = "This extension is currently working. It will automatically change every YouTube Shorts in a normal YouTube video.";
  const notActivatedText = "This extension is not currently working. Reactivate it to change every YouTube Shorts in a normal YouTube video.";

  //Load the current state of the checkbox
  chrome.storage.sync.get(['isEnabled'], function(data, event) {
    checkBox.checked = data.isEnabled;
    checkBox.checked ? description.textContent = activatedText : description.textContent = notActivatedText;
  });

  //Update the state when the checkbox is changed
  checkBox.addEventListener('change', async function() {
    chrome.storage.sync.set({ isEnabled: checkBox.checked });
    checkBox.checked ? description.textContent = activatedText : description.textContent = notActivatedText;
    //If the extension is enabled and the user is watching a YouTube Shorts video, change the url
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    if (checkBox.checked && tab.url.includes("youtube.com/shorts")) {
      const newUrl = tab.url.replace("shorts", "watch");
      chrome.tabs.update(tab.id, { url: newUrl });
    }
  });
});