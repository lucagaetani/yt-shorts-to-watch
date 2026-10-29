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
  assert.ok(manifest.description.length <= 132, `description is ${manifest.description.length} chars`);

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
