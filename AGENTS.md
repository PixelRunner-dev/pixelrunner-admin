# Pixelrunner Admin Agent Guide

`admin-vue` is the cloud-hosted Pixelrunner admin interface. It is a Vue 3,
TypeScript, Vite application for managing a Pixelrunner device, applets,
playlists, WiFi, settings, and display state.

## Architecture

- The production admin UI is served from `https://admin.pixelrunner.dev`.
- The cloud host serves static assets only. It does not know per-device secrets.
- Local device access must go through the Pixelrunner proxy, for example
  `http://pixelrunner.local/?via=proxy` or `http://<device-ip>/?via=proxy`.
- When served through the proxy, the browser reads
  `/.pixelrunner/proxy-config` from the device origin. That endpoint supplies
  room metadata and the per-device `roomPassword` used for Trystero/WebRTC.
- Opening `https://admin.pixelrunner.dev` directly cannot discover a dynamic
  device room password unless a separate pairing or cloud claim flow exists.
- Do not reintroduce a baked production room password in frontend code. The
  constant fallback is development-only.

## Project Structure

- `src/` - Vue application source.
- `src/components/` - Reusable Vue components.
- `src/pages/` - Route-level pages.
- `src/router/` - Vue Router routes.
- `src/ws/` - WebSocket and Trystero client code.
- `src/ws/room-id.ts` - Room ID/config discovery logic.
- `src/ws/trystero-client.ts` - Browser-side Trystero transport.
- `src/ws/api/` - RPC clients for device/controller APIs.
- `src/mocks/` - Local mock RPC client used by standalone admin dev and future tests.
- `src/utils/` - Shared frontend utilities.
- `public/` - Static frontend assets.
- `translations/` - i18n files for `de`, `en`, `es`, `fr`, `nl`.
- `test/` - Unit and e2e tests.
- `dist/` - Do not edit files here, but instead run `npm run build`.

## Commands

Run from `admin-vue/`.

```bash
npm install
npm run dev
npm run build
npm run build-only
npm run type-check
npm run lint
npm run lint:syntax
npm run lint:js
npm run test:unit
npm run test:e2e
npm run a11y
npm run format
```

### Standalone Mock Mode

Use mock mode when working on only `admin-vue` without running the device
controller or proxy:

```bash
DEV=true npm run dev
```

For Vite's dev server, `vite.config.ts` reads shell `DEV=true` and exposes
`import.meta.env.VITE_MOCK_CONTROLLER`. In that mode `src/main.ts` provides
`MockRpcClient` from `src/mocks/mock-rpc-client.ts` instead of creating a
proxy WebSocket, Trystero, or local controller WebSocket client. Keep this mock
behind the compile-time flag and keep its API responses aligned with
`src/ws/api/*`; unit and e2e tests should reuse the same mock client.

## Code Rules

- Keep the direct-cloud and local-proxy flows separate. Do not assume a cloud
  page can read local device secrets.
- Keep mock mode isolated to `DEV=true`. Do not let production builds bypass
  the proxy/controller connection path.
- When changing WebRTC connection logic, update both `src/ws/room-id.ts` and
  `src/ws/trystero-client.ts` together when needed.
- Never log room passwords, WiFi passwords, private keys, or full pairing
  tokens.
- Use typed API/RPC payloads and handle loading, timeout, reconnect, and fatal
  error states.
- Preserve mobile-first behavior and accessibility. Interactive controls need
  usable labels, focus states, and keyboard behavior.
- Vue components in `src/components/` should avoid native HTML tag names.
- Component filenames in `src/` use UpperCamelCase except `index.*` and
  `main.*`.
- Script filenames use kebab-case.
- Route page components use the `Page.vue` suffix.
- Do not disable ESLint or TypeScript checks without explicit user approval.

## Testing Notes

- Prefer targeted unit tests for room resolution, API clients, and stateful
  utilities.
- For UI flows, test both local-proxy mode and direct-cloud mode. Direct-cloud
  must fail gracefully or request pairing instead of silently using production
  defaults.
- If type-check fails on unrelated existing files, report exact failures and
  still verify changed files with focused tests or lint where possible.

### Playwright E2E

- **Never use `page.waitForTimeout` in committed test code.** It is permitted
  temporarily during local debugging but must be replaced before committing.
- Replace fixed delays with observable conditions instead:
  - `await expect(locator).toBeVisible()` / `.toHaveValue(...)` — retries
    automatically until condition or timeout.
  - `page.waitForEvent('console', msg => msg.text().includes('...'))` — wait
    for a specific console log emitted after an async operation completes. Set
    up the listener _before_ triggering the action to avoid the race window.
  - `page.waitForURL(...)` — wait for SPA navigation to settle.
  - `page.waitForSelector(...)` — wait for a DOM node to appear or disappear.
- When a Vue component has no observable DOM side-effect after an async save,
  add a `console.log` in the production code so tests can wait on it. Follow
  the `[ComponentName] Saved <key>` log pattern already used in
  `useSyncedControllerSettings` and `saveFeatureToggleSetting`.
- Use SPA link clicks (`page.locator('a[href="..."]').click()`) rather than
  `page.goto()` when in-memory mock state must survive navigation. `page.goto()`
  triggers a full page reload, destroying the mock client and its settings.
