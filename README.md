# View Switcher for YouTube Shorts
Tired to see YouTube Shorts videos? Switch to the normal YouTube video view, instantly.

It's a Chromium-based browser extension. To install it, follow this [tutorial](https://developer.chrome.com/docs/extensions/how-to/distribute/install-extensions?hl=en) or find it from Chrome Web Store at this [link](https://chromewebstore.google.com/detail/youtube-shorts-view-switc/njkfeheiifdcflohfcphcialknijmfgd).

The developer and this extension aren't affiliated with Google LLC. YouTube is a trademark of Google LLC.

See [CHANGELOG.md](CHANGELOG.md) for the version history.

## How it works
- **Opening a Shorts link** (address bar, new tab, external site): a `declarativeNetRequest` rule (`rules.json`) redirects `/shorts/<id>` to `/watch?v=<id>` before the page loads.
- **Clicking a Short inside YouTube**: YouTube changes pages without reloading, so a content script (`content.js`) intercepts the click and opens `/watch?v=<id>` instead. It replaces the Shorts entry in your history, so the Back button doesn't bring you back to the Short.
- The popup switch turns both of these on or off.

## Permissions
| Permission | Why |
| --- | --- |
| `storage` | Saves whether the switch is on or off. |
| `declarativeNetRequestWithHostAccess` | Redirects Shorts URLs to the normal video URL before the page loads. |
| Host access to `youtube.com` | Lets the redirect rule and the content script run on YouTube, and nowhere else. |

## Privacy
The extension doesn't collect, store or send any personal data. The only thing it saves is the on/off setting, kept in Chrome's synced extension storage.

## Development
- Load the folder unpacked from `chrome://extensions` (Developer mode → Load unpacked).
- Run the tests with Node.js 18 or newer: `node --test`
- When packaging for the Chrome Web Store, zip only the runtime files: `manifest.json`, `background.js`, `content.js`, `shorts-url.js`, `rules.json`, `index.html`, `index.js`, `index.css`, `_locales/`, `icons/`, and `LICENSE`.

## Translations
Available in English (default), Spanish, French, German, Chinese (Simplified), Portuguese (Brazil), Arabic, Dutch, Italian and Polish. Each language has a `_locales/<locale>/messages.json` file; to add one, copy `_locales/en/messages.json` and translate every `message`. `htmlLang` and `htmlDir` set the popup's language and text direction. The name "View Switcher for YouTube Shorts" is never translated, so it's written directly in `manifest.json` and `index.html`.
