document.addEventListener('DOMContentLoaded', function() {
  const checkBox = document.querySelector('input[type="checkbox"]');

  //Load the current state of the checkbox
  chrome.storage.sync.get(['isEnabled'], function(data) {
    checkBox.checked = data.isEnabled;
  });

  //Update the state when the checkbox is changed
  checkBox.addEventListener('change', function() {
    chrome.storage.sync.set({ isEnabled: checkBox.checked });
  });
});