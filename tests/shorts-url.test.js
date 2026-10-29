// Run from the repository root with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../shorts-url.js");
const { toWatchUrl } = globalThis.ShortsUrl;

const root = path.join(__dirname, "..");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const CONVERSIONS = [
  ["https://www.youtube.com/shorts/abc123_-XYZ", "https://www.youtube.com/watch?v=abc123_-XYZ"],
  ["https://www.youtube.com/shorts/abc123/", "https://www.youtube.com/watch?v=abc123"],
  ["https://www.youtube.com/shorts/abc123?feature=share", "https://www.youtube.com/watch?v=abc123"],
  ["https://m.youtube.com/shorts/abc123", "https://m.youtube.com/watch?v=abc123"],
  ["https://youtube.com/shorts/abc123", "https://youtube.com/watch?v=abc123"],
];

const NOT_SHORTS = [
  "https://www.youtube.com/",
  "https://www.youtube.com/watch?v=abc123",
  "https://www.youtube.com/feed/shorts",
  "https://www.youtube.com/@channel/shorts",
  "https://www.youtube.com/shorts/",
  "https://www.youtube.com/shorts/abc/extra",
  "https://www.youtube.com/shorts/bad%20id",
  "http://www.youtube.com/shorts/abc123",
  "https://evil.example/shorts/abc123",
  "https://music.youtube.com/shorts/abc123",
  "javascript:alert(1)",
  "not a url",
];

test("converts Shorts URLs to watch URLs", () => {
  for (const [input, expected] of CONVERSIONS) {
    assert.equal(toWatchUrl(input), expected, input);
  }
});

test("ignores URLs that are not Shorts videos", () => {
  for (const input of NOT_SHORTS) {
    assert.equal(toWatchUrl(input), null, input);
  }
});

test("redirect rule agrees with the content script on https URLs", () => {
  const [rule] = readJson("rules.json");
  const filter = new RegExp(rule.condition.regexFilter, "i");
  const substitution = rule.action.redirect.regexSubstitution.replace(/\\(\d)/g, "$$$1");
  const redirect = (url) => (filter.test(url) ? url.replace(filter, substitution) : null);

  for (const [input, expected] of CONVERSIONS) {
    assert.equal(redirect(input), expected, input);
  }
  for (const input of NOT_SHORTS.filter((url) => url.startsWith("https://"))) {
    assert.equal(redirect(input), null, input);
  }
});

test("redirect rule avoids counted repetition", () => {
  // Chrome compiles regexFilter with RE2 and skips rules over 2KB; a quantifier such as
  // {1,64} is expanded into 64 copies of the pattern and exceeded that limit.
  for (const rule of readJson("rules.json")) {
    assert.doesNotMatch(rule.condition.regexFilter, /\{\d+(,\d*)?\}/, `rule ${rule.id}`);
  }
});

test("manifest is valid for the Chrome Web Store", () => {
  const manifest = readJson("manifest.json");
  assert.equal(manifest.manifest_version, 3);
  // The product name is never translated.
  assert.equal(manifest.name, "View Switcher for YouTube Shorts");
  assert.equal(manifest.action.default_title, manifest.name);
  assert.ok(fs.existsSync(path.join(root, "_locales", manifest.default_locale, "messages.json")));

  const referencedFiles = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    ...manifest.content_scripts.flatMap((script) => script.js),
    ...manifest.declarative_net_request.rule_resources.map((resource) => resource.path),
  ];
  for (const file of referencedFiles) {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  }
});

test("every locale translates every message within Chrome's limits", () => {
  const manifest = readJson("manifest.json");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const popupScript = fs.readFileSync(path.join(root, "index.js"), "utf8");

  const referencedKeys = new Set([
    ...[...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((match) => match[1]),
    ...[...html.matchAll(/data-i18n="(\w+)"/g)].map((match) => match[1]),
    ...[...popupScript.matchAll(/\bt\("(\w+)"\)/g)].map((match) => match[1]),
  ]);
  const defaultKeys = Object.keys(readJson(`_locales/${manifest.default_locale}/messages.json`)).sort();
  for (const key of referencedKeys) {
    assert.ok(defaultKeys.includes(key), `message "${key}" is used but not defined`);
  }

  const locales = fs.readdirSync(path.join(root, "_locales"));
  assert.deepEqual(locales.sort(), ["ar", "de", "en", "fr", "it", "nl", "pl", "pt_BR", "zh_CN"]);
  for (const locale of locales) {
    const messages = readJson(`_locales/${locale}/messages.json`);
    assert.deepEqual(Object.keys(messages).sort(), defaultKeys, `${locale} keys`);
    for (const [key, { message }] of Object.entries(messages)) {
      assert.ok(typeof message === "string" && message.trim() !== "", `${locale}.${key} is empty`);
    }
    assert.ok(messages.extDescription.message.length <= 132, `${locale} description is too long`);
    assert.ok(["ltr", "rtl"].includes(messages.htmlDir.message), `${locale} htmlDir`);
  }
});
