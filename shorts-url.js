// Converts a YouTube Shorts URL into the equivalent /watch URL.
// Loaded as a classic script before content.js (content scripts cannot import modules)
// and by the Node tests, so it exposes a single global instead of using exports.
(function (root) {
  const YOUTUBE_HOSTS = new Set(["www.youtube.com", "m.youtube.com", "youtube.com"]);
  const SHORTS_PATH = /^\/shorts\/([A-Za-z0-9_-]+)\/?$/;

  function toWatchUrl(input) {
    let url;
    try {
      url = new URL(input);
    } catch {
      return null;
    }

    if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname)) {
      return null;
    }

    const match = SHORTS_PATH.exec(url.pathname);
    if (!match) {
      return null;
    }

    const watchUrl = new URL("/watch", url.origin);
    watchUrl.searchParams.set("v", match[1]);
    return watchUrl.href;
  }

  root.ShortsUrl = Object.freeze({ toWatchUrl });
})(globalThis);
