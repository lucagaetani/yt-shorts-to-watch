// Full page loads of /shorts/ are redirected by rules.json before the page exists.
// YouTube is a single-page app, though: clicking a Short inside the site never loads a new
// page, so this script catches those in-page navigations.
(() => {
  const { toWatchUrl } = globalThis.ShortsUrl;

  // Stay inert until the stored preference is known.
  let isEnabled = false;

  function redirectCurrentPage() {
    if (!isEnabled) {
      return;
    }
    const watchUrl = toWatchUrl(location.href);
    // replace() overwrites the /shorts/ history entry, so Back never lands on it again.
    if (watchUrl) {
      location.replace(watchUrl);
    }
  }

  function findLink(event) {
    for (const node of event.composedPath()) {
      if (node instanceof HTMLAnchorElement && node.href) {
        return node;
      }
    }
    return null;
  }

  function isPlainLeftClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  function handleClick(event) {
    // Clicks that open a new tab or window are full page loads, handled by rules.json.
    if (!isEnabled || !isPlainLeftClick(event)) {
      return;
    }
    const link = findLink(event);
    if (!link || (link.target && link.target !== "_self")) {
      return;
    }
    const watchUrl = toWatchUrl(link.href);
    if (!watchUrl) {
      return;
    }
    // Capture phase on window runs before YouTube's router, so the Shorts player never starts.
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(watchUrl);
  }

  window.addEventListener("click", handleClick, true);

  // Fallback for in-page navigations that do not come from a link click (e.g. history traversal).
  if ("navigation" in window) {
    navigation.addEventListener("currententrychange", redirectCurrentPage);
  }
  // Pages restored from the back/forward cache do not reload or reach rules.json.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      redirectCurrentPage();
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !("isEnabled" in changes)) {
      return;
    }
    isEnabled = changes.isEnabled.newValue !== false;
    // Turning the switch on while a Short is open switches it straight away.
    redirectCurrentPage();
  });

  chrome.storage.sync
    .get("isEnabled")
    .then(({ isEnabled: storedValue }) => {
      isEnabled = storedValue !== false;
      redirectCurrentPage();
    })
    .catch((error) => console.error("View Switcher: could not read settings", error));
})();
