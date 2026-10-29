# AGENTS.md — Chrome Web Store Extension Engineering Guide

This file defines the engineering standards, architecture principles, security requirements, and delivery workflow for AI agents and developers working on this Chrome extension.

> **Goal:** build a secure, maintainable, accessible, performant, and reviewable Chrome extension that follows Chrome Extensions Manifest V3 and Chrome Web Store policies.
>
> **Project-specific rule:** inspect the existing repository before making changes. Preserve its established stack and conventions unless there is a concrete reason to change them. Never assume files, scripts, libraries, APIs, or requirements exist without checking.

---

## 1. Core Principles

All contributors and coding agents MUST:

1. **Understand before editing.** Inspect the repository, `package.json`, manifest, source tree, tests, build setup, and relevant documentation before changing code.
2. **Prefer small, focused changes.** Solve the requested problem without unrelated refactors or unnecessary dependencies.
3. **Follow Manifest V3.** Use supported extension APIs and avoid deprecated Manifest V2 patterns.
4. **Apply least privilege.** Request only permissions and host access that the feature genuinely needs.
5. **Treat all external input as untrusted.** This includes webpage content, messages from content scripts, URL parameters, remote responses, imported data, and storage values.
6. **Keep secrets out of the client.** Never place private API keys, signing credentials, tokens, or server secrets in extension source or build output.
7. **Test behavior, not just syntax.** Run relevant automated tests, linting, type checks, and production builds when available.
8. **Explain trade-offs.** Record meaningful architectural or security decisions and any checks that could not be run.
9. **Avoid false claims.** Do not say a test passed, a feature works, or a Chrome Web Store policy was verified unless the relevant check was actually performed.
10. **Keep documentation accurate.** Update README, permission rationale, setup instructions, and tests when behavior changes.

When instructions conflict, prioritize applicable law and Chrome Web Store policies, then security and correctness, then explicit project requirements, then these defaults.

---

## 2. Repository Discovery and First Steps

Before implementing a task:

- Read this file and any more specific `AGENTS.md` files in relevant subdirectories.
- Inspect the repository status and existing uncommitted changes. Do not overwrite or revert a user's work.
- Identify the current architecture and framework: plain JavaScript, TypeScript, React, Vue, Svelte, or another existing stack.
- Inspect:
  - `manifest.json`
  - `package.json` and lockfile
  - build and bundler configuration
  - background service worker
  - content scripts
  - popup, side panel, options, and other UI entry points
  - storage and messaging abstractions
  - tests and CI configuration
  - README and privacy disclosures
- Find the existing scripts before running commands. Do not invent script names.
- Check the target Chrome version and minimum supported features.
- For Chrome APIs, security-sensitive behavior, and store policy questions, consult current official Chrome documentation rather than relying on memory.

Do not replace the project structure or framework merely because another approach is familiar. If the repository is empty, propose or establish a minimal structure appropriate to the requirements.

---

## 3. Recommended Extension Architecture

Use only the components the product actually needs. Avoid creating empty layers for hypothetical future features.

### 3.1 Typical components

- **Popup** — brief, task-oriented interface shown when the toolbar icon is clicked. It may close when focus changes, so do not use it for long workflows that need persistent state.
- **Options page** — settings and preferences.
- **Side panel** — longer-lived workflows where appropriate and supported by the target Chrome version.
- **Background service worker** — event handling, coordination, extension lifecycle events, alarms, context menus, and privileged operations.
- **Content scripts** — limited DOM interaction with pages explicitly covered by the extension's product behavior.
- **Shared modules** — domain logic, validation, storage adapters, API clients, and common types.
- **Backend service** — optional; use it for secrets, privileged external integrations, durable shared data, or operations that cannot safely be performed in the extension client.

### 3.2 Keep responsibilities separate

- UI components render state and report user actions.
- Domain modules implement business rules and should be testable without a browser where practical.
- Chrome API adapters isolate browser-specific behavior.
- Storage modules own serialization, validation, migrations, and persistence.
- Network modules centralize request construction, timeouts, error handling, and response validation.
- The service worker coordinates events; it should not become a giant file containing all application logic.

Prefer explicit dependency boundaries over a large global singleton. Avoid overengineering a small extension with needless abstraction.

### 3.3 Service worker lifecycle

Manifest V3 service workers can be suspended and restarted. Therefore:

- Never assume in-memory state survives between events.
- Persist important state in appropriate storage.
- Register event listeners synchronously at the top level of the service worker whenever the API requires it.
- Design handlers to be safe when invoked more than once.
- Use `chrome.alarms` for supported scheduled work instead of relying on `setInterval` to keep a service worker alive.
- Do not attempt to keep the worker alive through artificial activity.
- Handle missing, stale, or partially migrated persisted state.
- Use `runtime.onInstalled` and other lifecycle events deliberately; avoid resetting user data on ordinary updates.

---

## 4. Manifest V3 Requirements

`manifest.json` is a security-sensitive product configuration file. Keep it valid, minimal, and aligned with actual functionality.

### 4.1 General rules

- Use `"manifest_version": 3`.
- Declare only required fields and permissions.
- Keep the extension name, description, icons, version, entry points, and permissions consistent with the shipped product.
- Set a sensible minimum Chrome version only if the code depends on features unavailable in earlier versions.
- Validate the manifest in the build and release process.
- Do not include development-only permissions, debug scripts, local test URLs, or unnecessary files in the production package.

### 4.2 Permissions and host access

For every permission, document:

1. Which user-visible feature requires it.
2. Which code path uses it.
3. Why a less-privileged alternative is insufficient.
4. Whether the permission can be requested at runtime when the user invokes the feature.

Rules:

- Prefer `activeTab` and user-initiated access when they meet the requirements.
- Prefer optional permissions and optional host permissions for optional features.
- Avoid broad host patterns such as `<all_urls>` unless the product truly needs them and the use is justified.
- Do not request `tabs`, history, cookies, downloads, clipboard, scripting, or other sensitive access speculatively.
- Explain permission requests in plain language at the moment users need to understand them.
- Do not add permissions just to simplify implementation.
- Ensure the privacy policy and store listing accurately describe data access and use.

### 4.3 Content Security Policy

- Follow Manifest V3 extension-page CSP restrictions.
- Do not use `eval`, `new Function`, string-based timers, or other patterns that execute arbitrary strings as code.
- Do not load executable JavaScript remotely.
- Bundle required executable code with the extension.
- Treat remote data as data, never as executable code.
- Do not weaken CSP to make an insecure dependency or implementation work.

### 4.4 Production package

- Include only runtime assets, required localization, and required license notices.
- Exclude source maps if they expose sensitive source or are not intended for distribution; decide deliberately based on the release process.
- Exclude `.env` files, credentials, local logs, test fixtures containing personal data, temporary files, and development tooling.
- Verify that all manifest paths point to files that exist in the final package.

---

## 5. Security and Privacy

Security is a design requirement, not a final cleanup task.

### 5.1 DOM and injection safety

- Do not insert untrusted strings with `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or equivalent unsafe rendering.
- Prefer `textContent`, safe DOM construction, and framework escaping.
- If rich HTML is a genuine requirement, use a well-maintained sanitizer with a strict allowlist and review its configuration.
- Never evaluate webpage text or API responses as code.
- Avoid inline event handlers in HTML.
- Validate URL schemes before opening or navigating to user-provided URLs. Reject dangerous schemes such as `javascript:` where they are not explicitly needed.
- Do not trust CSS selectors, HTML snippets, or commands supplied by a webpage.

### 5.2 Messaging

Treat messages between the popup, service worker, content scripts, options page, and external sources as untrusted input.

- Define explicit message types and schemas.
- Validate message shape, field types, lengths, enums, and allowed actions at the receiving boundary.
- Verify sender identity, origin, tab/frame context, and URL when relevant.
- Do not expose privileged operations through a generic “execute command” message.
- Restrict `onMessageExternal` and externally connectable origins to an explicit allowlist when used.
- Return structured, minimal error information; do not leak secrets or internal implementation details.
- Avoid race conditions and duplicate side effects when handling asynchronous messages.

### 5.3 Network requests and APIs

- Use HTTPS for remote services.
- Validate response status, content type where appropriate, schema, and size before processing.
- Add sensible timeouts, cancellation where supported, bounded retries, and backoff for transient failures.
- Do not retry non-idempotent actions blindly.
- Avoid logging tokens, authorization headers, personal data, or full sensitive payloads.
- Do not assume CORS restrictions or extension host permissions replace server-side authorization.
- Keep API credentials on a backend. Any secret embedded in an extension package must be considered public.
- Never send page contents, browsing data, or user information to a server unless required, disclosed, and handled in accordance with applicable policy and consent requirements.

### 5.4 Storage

Choose storage based on purpose:

- `chrome.storage.local` for extension-owned local settings and data.
- `chrome.storage.sync` only for small user preferences that should sync and whose quotas and behavior are appropriate.
- `chrome.storage.session` for suitable transient data that should not persist across browser sessions.
- IndexedDB or a backend for larger or more complex data where justified.

Additional rules:

- Validate and version stored data.
- Handle missing keys, corrupted data, quota failures, and migration errors.
- Store the minimum information required.
- Do not store credentials or sensitive data without a compelling, reviewed need and a suitable security design.
- Do not treat client-side storage as a secure vault.
- Restrict storage access levels where supported and appropriate.
- Make deletion and reset behavior clear to users.
- Do not collect analytics or telemetry by default without a clear product reason and transparent disclosure.

### 5.5 Privacy by design

- Document what data is accessed, collected, stored, transmitted, and deleted.
- Collect the minimum necessary data for the feature.
- Obtain any required user consent before collection or transmission.
- Make the privacy policy and Chrome Web Store Data usage disclosures accurate and consistent.
- Avoid unnecessary browsing-history collection, fingerprinting, hidden tracking, or sale of user data.
- Provide a way to clear user-created or stored data when applicable.
- Ensure logs and diagnostics do not contain unnecessary personal information.
- Review third-party libraries and remote services for their data practices.

---

## 6. Clean Code and Maintainability

### 6.1 Naming

Use names that communicate purpose:

- Variables and functions: `camelCase`
- Classes and types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` for true module-level constants, otherwise follow existing conventions
- Files: follow the established repository convention consistently
- Boolean names should read naturally: `isEnabled`, `hasPermission`, `canOpenTab`

Avoid cryptic abbreviations, misleading names, unnecessary prefixes, and names that conceal side effects.

### 6.2 Functions and modules

- Each function should have one clear responsibility.
- Keep functions small enough to understand without mentally simulating many branches.
- Separate pure calculations from browser, storage, and network side effects.
- Prefer early returns for invalid states and guard clauses.
- Avoid deeply nested conditionals; extract well-named helpers when this improves clarity.
- Pass dependencies explicitly when it makes code easier to test.
- Keep modules cohesive and avoid circular dependencies.
- Do not create a generic framework for a single simple use case.
- Do not hide important side effects inside deceptively named getters or formatting functions.

### 6.3 Duplication and abstraction

- Follow DRY when duplication represents the same rule or behavior.
- Do not merge similar-looking code if the underlying business rules differ.
- Prefer simple, local duplication over an abstraction that is harder to understand.
- Introduce shared utilities when there are multiple real callers and a stable common contract.
- Keep abstractions proportional to the project's size.

### 6.4 Errors and asynchronous code

- Handle expected failures explicitly.
- Use `async`/`await` consistently when it improves readability.
- Catch errors only when the code can recover, add useful context, or translate them into a stable interface.
- Do not silently swallow exceptions.
- Avoid empty `catch` blocks.
- Avoid unhandled promise rejections from event listeners and UI handlers.
- Distinguish user-correctable errors, permission denials, transient failures, and programming defects.
- Show clear user-facing errors without exposing sensitive internals.
- Use `finally` to clean up loading state or resources where appropriate.
- Make loading, success, empty, and failure states explicit in UI flows.

### 6.5 Comments and documentation

- Write code that explains itself through clear names and structure.
- Comment *why* a non-obvious decision exists, not merely what the next line does.
- Document public module contracts, complex algorithms, permission rationale, and security assumptions.
- Update comments when behavior changes.
- Remove stale, redundant, or speculative comments.
- Use TODOs only when they identify a real follow-up; include context or a tracking issue when available.

### 6.6 Avoid

- Giant files and “god objects.”
- Magic numbers or repeated configuration values without meaningful names.
- Unnecessary global state.
- Boolean flags that create many unrelated execution paths.
- Nested ternaries for complex logic.
- Overly generic error messages or silent fallback behavior that masks failures.
- Dead code, unused dependencies, commented-out implementations, and abandoned feature flags.
- Unnecessary dependencies for trivial functionality.
- Premature optimization without evidence.
- Broad refactors mixed into a small feature fix.

---

## 7. JavaScript and TypeScript Standards

Prefer the repository's existing language. If TypeScript is already used, keep types strict and meaningful.

- Enable strict TypeScript settings where feasible; do not weaken compiler options just to bypass errors.
- Avoid `any`. Prefer `unknown` at untrusted boundaries and narrow it through validation.
- Avoid non-null assertions unless the invariant is established and documented.
- Model domain states with discriminated unions where this makes invalid states harder to represent.
- Prefer `const`; use `let` only when reassignment is necessary.
- Avoid `var`.
- Use strict equality (`===` and `!==`).
- Do not mutate shared objects unexpectedly.
- Use immutable transformations when they improve clarity, not as dogma.
- Handle `null`, `undefined`, and optional fields deliberately.
- Avoid fire-and-forget promises unless errors are handled.
- Use `AbortController` for cancellable fetches when appropriate.
- Do not introduce TypeScript solely for fashion if the existing project has a stable JavaScript toolchain; evaluate migration separately.

### Example: validate untrusted data

```ts
type UserSettings = {
  enabled: boolean;
  theme: "light" | "dark" | "system";
};

function parseUserSettings(value: unknown): UserSettings | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.enabled !== "boolean" ||
    (candidate.theme !== "light" &&
      candidate.theme !== "dark" &&
      candidate.theme !== "system")
  ) {
    return null;
  }

  return {
    enabled: candidate.enabled,
    theme: candidate.theme,
  };
}
```

Use a schema-validation library if the project already has one or the schema complexity justifies it. Avoid adding one for a single trivial check.

---

## 8. UI, UX, Accessibility, and Performance

### 8.1 User experience

- Make the primary action obvious.
- Keep the popup focused; move complex or persistent workflows to an options page or side panel.
- Provide clear loading, success, empty, error, and permission-denied states.
- Prevent duplicate submissions while an operation is in progress.
- Confirm destructive or irreversible actions.
- Preserve user input after recoverable errors.
- Do not make the interface depend on network availability unless the product requires it.
- Explain why a permission is needed at the moment it becomes relevant.

### 8.2 Accessibility

- Use semantic HTML and native controls wherever possible.
- Ensure all interactive elements work with a keyboard.
- Provide visible focus indicators.
- Associate labels with inputs.
- Give icon-only controls accessible names.
- Use adequate color contrast and do not convey state through color alone.
- Support zoom and reasonable text resizing.
- Announce important dynamic status updates appropriately, such as with `aria-live`.
- Respect reduced-motion preferences.
- Test the UI without a mouse and, where practical, with a screen reader.

### 8.3 Performance

- Keep popup startup and service worker initialization lightweight.
- Avoid loading large libraries for a single small interaction.
- Lazy-load optional UI and expensive features when appropriate.
- Avoid repeated DOM scans and unnecessary observers in content scripts.
- Clean up event listeners, observers, timers, and subscriptions when no longer needed.
- Debounce expensive user input when appropriate; do not debounce actions that must be immediate.
- Avoid unnecessary background polling.
- Measure bundle size and runtime behavior before optimizing.
- Do not block the main thread with large computations; use suitable APIs or a worker only where justified and compatible with the extension architecture.

### 8.4 UI implementation

- Keep presentation separate from domain logic.
- Use the existing design system and component patterns.
- Avoid direct DOM manipulation inside a framework-managed tree.
- Keep state as local as possible.
- Avoid storing derived state when it can be computed reliably.
- Ensure asynchronous UI updates do not overwrite newer user actions.
- Use stable keys for rendered lists.
- Do not inject CSS or modify page appearance outside the feature's intended scope.
- Scope content-script styles to reduce collisions with host pages.

---

## 9. Chrome API Usage

- Use documented `chrome.*` APIs supported by the target Chrome version.
- Prefer official API types and accurate TypeScript definitions if TypeScript is used.
- Handle rejected promises, missing tabs, closed windows, revoked permissions, and unavailable APIs.
- Do not assume an active tab exists in every event context.
- Do not assume a content script is injected or ready when sending a message.
- Design message flows to handle timeouts and missing receivers.
- Use `chrome.runtime.getURL()` for packaged extension resources rather than hard-coded extension IDs.
- Use `chrome.storage` rather than `localStorage` for shared extension state across extension contexts.
- Use `chrome.scripting` only when the manifest permissions and user-facing behavior justify it.
- Avoid relying on undocumented APIs or browser internals.
- Ensure `web_accessible_resources` exposes only resources that need to be reachable from web pages.

---

## 10. Testing Strategy

Choose the test stack already present in the repository. Do not add a new testing framework without a clear benefit.

### 10.1 Unit tests

Test pure logic and domain rules, including:

- input validation and parsing
- calculations and transformations
- filtering and sorting
- permission decision logic
- storage migration functions
- error mapping
- boundary conditions and invalid input

Unit tests should be deterministic, fast, and independent of real browser state where practical.

### 10.2 Integration tests

Test interactions between modules and browser API wrappers:

- storage read/write and migration behavior
- message validation and response handling
- API client response validation
- permission-denied behavior
- lifecycle handlers and repeated events
- cleanup of listeners and observers

Mock browser APIs at stable boundaries rather than mocking every internal function.

### 10.3 End-to-end and manual tests

When the toolchain supports it, verify the built extension in a clean Chrome profile:

- installation and first-run behavior
- toolbar popup and options page
- all core user journeys
- permission prompts and denial paths
- navigation and tab lifecycle cases
- offline, slow-network, and server-error states where relevant
- upgrades from the previous supported version
- reset and data-deletion behavior
- keyboard-only and responsive UI behavior

Do not claim full browser testing if only unit tests were run.

### 10.4 Regression tests

When fixing a bug:

1. Reproduce it or establish a reliable failing test.
2. Add a regression test where practical.
3. Make the smallest safe fix.
4. Run the targeted test and relevant broader checks.
5. Explain any untested cases.

### 10.5 Required quality gates

Before delivery, run the checks that exist in the project, typically:

- formatter check
- lint
- type check
- unit tests
- integration tests, if configured
- production build
- manifest/package validation

Do not invent results or hide failures. If a check cannot run because of environment limitations, state that explicitly.

---

## 11. Dependencies and Supply Chain

- Prefer stable, maintained dependencies with a clear purpose.
- Check package maintenance, license, security advisories, and bundle impact before adding a dependency.
- Avoid duplicate libraries that solve the same problem.
- Pin and lock dependencies through the existing package manager and commit the appropriate lockfile.
- Do not casually upgrade unrelated packages during feature work.
- Review dependency changes in the diff.
- Run the repository's available audit and vulnerability checks when practical.
- Do not paste secrets into package scripts, CI logs, issue trackers, or source control.
- Never install a package solely because an unverified blog recommends it.

---

## 12. Build, Configuration, and Environments

- Keep development, test, and production configuration distinct.
- Use environment variables for build-time configuration only when appropriate; remember that values bundled into client code are public.
- Validate required configuration early and provide actionable errors.
- Do not ship localhost endpoints or development flags unintentionally.
- Ensure the production build is reproducible.
- Keep build output separate from source.
- Confirm the generated manifest points to generated files and correct asset paths.
- Test the actual packaged output, not just the source tree.
- Never commit private credentials or signing keys.
- Document how to build and load the unpacked extension locally.

---

## 13. Chrome Web Store Readiness

Treat store review as part of engineering.

### 13.1 Product behavior and policy

- The extension must have a clear, single purpose that matches its listing.
- Every permission and data use must be necessary for disclosed functionality.
- Do not implement hidden functionality, deceptive installation flows, misleading claims, or unexpected redirects.
- Do not inject advertisements or affiliate behavior unrelated to the disclosed product purpose.
- Do not manipulate reviews, ratings, search results, or store behavior.
- Avoid remote code execution and remotely hosted executable logic.
- Ensure behavior is transparent and consistent with the user-facing description.
- Review current Chrome Web Store policies before submission; policy requirements can change.

### 13.2 Listing and disclosures

Prepare and verify:

- accurate extension name and concise description
- clear, truthful feature descriptions
- screenshots that match the actual shipped UI
- suitable icons and promotional assets, where required
- privacy policy URL when required
- accurate privacy practices and data-use declarations
- permission justifications
- support contact and troubleshooting instructions
- any required account or test instructions for reviewers

Do not claim the extension is “official,” endorsed, or affiliated with another organization unless authorized.

### 13.3 Release checklist

Before uploading:

- [ ] Increment the extension version according to the release plan.
- [ ] Confirm the production manifest uses Manifest V3.
- [ ] Remove development-only files and permissions.
- [ ] Confirm there are no secrets in the package.
- [ ] Build from a clean, reproducible environment.
- [ ] Inspect the final ZIP contents and file paths.
- [ ] Install and test the packaged extension.
- [ ] Test fresh install and upgrade paths where relevant.
- [ ] Verify permissions and host access against the listing and privacy disclosures.
- [ ] Verify icons, screenshots, descriptions, and links.
- [ ] Review current Chrome Web Store policies and any warnings from the Developer Dashboard.
- [ ] Record the version, changes, checks run, and known limitations.

A successful upload does not guarantee approval. Never state that the extension is policy-compliant or approved without appropriate evidence.

---

## 14. Git and Change Management

- Make focused, reviewable changes.
- Preserve unrelated uncommitted user changes.
- Never run destructive Git commands unless explicitly requested and the impact is understood.
- Do not rewrite shared history or force-push unless specifically authorized.
- Use meaningful commit messages if asked to commit.
- Keep generated files and lockfiles consistent with repository conventions.
- Inspect the final diff for accidental changes, debug output, credentials, and unrelated formatting.
- Explain database/storage migrations and breaking changes clearly.
- Do not commit automatically unless the user requests it or the established workflow explicitly requires it.

---

## 15. Working Rules for AI Coding Agents

When acting as an autonomous coding agent:

1. Translate the request into a concise list of observable acceptance criteria.
2. Inspect the relevant files and existing patterns.
3. Identify security, permissions, privacy, migration, and compatibility implications before implementation.
4. Make a short plan for multi-step or cross-cutting work.
5. Implement the smallest complete solution.
6. Add or update tests and documentation.
7. Run the most relevant checks available.
8. Inspect the diff and verify that only intended files changed.
9. Report:
   - what changed
   - important implementation decisions
   - tests and commands actually run
   - test/build results
   - known limitations or follow-up work

Additional constraints:

- Do not replace working code wholesale when a targeted change is sufficient.
- Do not silently change the extension's intended behavior, permissions, data collection, or user-facing claims.
- Ask for clarification when a missing requirement materially changes security, privacy, cost, or user-visible behavior. Otherwise, make a reasonable, reversible assumption and state it.
- Never fabricate API behavior, test results, repository files, or policy requirements.
- Do not expose secrets or sensitive user data in summaries.
- Keep changes easy for a human to review and maintain.

---

## 16. Definition of Done

A task is complete only when all applicable items below are satisfied:

- [ ] Acceptance criteria are met.
- [ ] Code follows existing architecture and clean-code standards.
- [ ] Security and privacy implications have been reviewed.
- [ ] Permissions remain minimal and justified.
- [ ] Errors and edge cases are handled.
- [ ] Relevant tests have been added or updated.
- [ ] Available lint, type, test, and build checks have been run.
- [ ] User-facing documentation and disclosures are updated if needed.
- [ ] Production package does not include secrets or development-only artifacts.
- [ ] Final diff is focused and reviewed.
- [ ] The delivery summary accurately describes changes, checks, and limitations.

---

## 17. Official References

Use the latest official documentation when verifying APIs and policy requirements:

- Chrome Extensions overview: https://developer.chrome.com/docs/extensions/
- Manifest V3 migration: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- Manifest file: https://developer.chrome.com/docs/extensions/reference/manifest
- Extension service workers: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers
- Extension permissions: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Extension security: https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure
- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Chrome Web Store quality guidelines: https://developer.chrome.com/docs/webstore/best_practices/

These links are starting points. Verify current requirements before making security-sensitive or release decisions.
