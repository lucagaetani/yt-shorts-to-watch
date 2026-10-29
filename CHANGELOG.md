# Changelog

All notable changes to this extension are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-10-29

### Added
- Translations for Spanish, French, German, Chinese (Simplified), Portuguese (Brazil), Arabic, Dutch,
  Italian and Polish, using Chrome's `_locales` system. The description and popup text follow the
  browser's language and fall back to English. The popup is shown right-to-left in Arabic.
  The extension name "View Switcher for YouTube Shorts" is never translated.

### Changed
- Renamed the extension from "YouTube Shorts View Switcher" to **"View Switcher for YouTube Shorts"**.
- New manifest description: "YouTube Shorts open as normal videos." The non-affiliation
  notice ("The developer and this extension aren't affiliated with Google LLC.") is in the README.
- **Shorts now switch to the normal video view instantly.** Before, the extension waited for the
  Shorts page to finish loading and then reloaded the tab on `/watch`. Now:
  - Opening a `/shorts/` link directly (address bar, new tab, external link) is redirected by a
    `declarativeNetRequest` rule (`rules.json`) before the page is even requested, so the Shorts page never loads.
  - Clicking a Short inside YouTube is intercepted by a content script (`content.js`) before
    YouTube's own navigation starts, and goes straight to `/watch`.
- Turning the switch on while a Short is open now switches that tab immediately, through the
  content script instead of the popup.
- The toolbar icon (active/inactive) and the redirect rule are managed by the service worker
  and restored on browser startup and extension updates.
- Updated the code to current Manifest V3 practice: promise-based Chrome APIs, error handling,
  and `minimum_chrome_version` 102.
- Popup: accessible switch (`role="switch"`, label, keyboard focus outline, live status text),
  reduced-motion support, rounded switch, fixed invalid `font` CSS, page title and language.

### Fixed
- **Back button loop:** going back after a switch used to return to the `/shorts/` page, which
  triggered the reload again. The switch now replaces the Shorts entry in the history, so Back
  goes to the page you were on before the Short.
- The switch no longer turns itself back on every time the browser restarts or the extension updates.
- The toolbar icon now shows the correct state after a browser restart.
- The redirect rule in `rules.json` was skipped by Chrome ("regexFilter value exceeded the 2KB
  memory limit when compiled"). The video ID length limit `{1,64}` was expanded by Chrome's regex
  engine into 64 copies of the pattern; it is now `+`, in both the rule and the content script.
  A test now prevents this kind of quantifier from coming back.
- Opening the popup no longer shows the switch sliding from "off" to "on": it now appears directly
  in its saved position. Clicking the switch still animates.

### Security & privacy
- Removed the `tabs` permission ("Read your browsing history"). The extension now only
  has access to `youtube.com` (`www`, `m` and bare domain), which it needs to redirect Shorts.
- Added `declarativeNetRequestWithHostAccess` and `host_permissions` for YouTube only.

## [1.2.1] - 2024-04-22

### Added
- Turning the switch on while a Short is open reloads it as a normal video.

### Changed
- Minor popup tweaks.

## [1.2] - 2024-04-20

### Added
- Working enable/disable switch in the popup, with an inactive toolbar icon.

## [1.1] - 2024-03-04

### Added
- First version of the popup switch.

### Fixed
- Wrong redirect behavior.

## [1.0] - 2024-02-28

### Added
- First release: YouTube Shorts are reopened in the normal `/watch` video view.
