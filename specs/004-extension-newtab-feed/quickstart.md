# Quickstart: Validate Extension New-Tab Feed

## Prerequisites

- specs/003 implemented and verified (bearer token issuance/revocation works)
- Docker stack running (`docker compose up --build`)
- `npm install` inside `extension/`
- `npm run build:chrome` and/or `npm run build:firefox` inside `extension/`
  (one manifest source, two separate output directories — see
  `manifest.config.ts`)
- Demo user `demo@ksplatform.dev` subscribed to at least one tag with
  existing posts/tweets (seed data or manual subscribe via the web app)

## Load the extension

**Chrome**: `chrome://extensions` → Developer mode → Load unpacked →
`extension/dist`

**Firefox**: `about:debugging#/runtime/this-firefox` → Load Temporary
Add-on → select `extension/dist-firefox/manifest.json`

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
cd extension && npx tsc --noEmit && npm run lint
```

## Manual smoke test

1. **Fresh install (User Story 2)**: Open a new tab. Expect the "Connect
   your KSPlatform account" prompt, not a feed or error.
2. **Connect**: Follow the prompt through the specs/003 device flow (code
   shown, approve on `/connect`). Expect the extension to detect approval
   within its poll interval.
3. **Feed (User Story 1)**: Open a new tab. Expect posts/tweets from
   `demo@ksplatform.dev`'s subscribed tags, newest first, within 2 seconds.
4. **Infinite scroll**: Scroll to the bottom. Expect more items to load if
   more exist.
5. **Click-through**: Click a feed item. Expect it opens the corresponding
   KSPlatform post/tweet page in a new browser tab.
6. **Empty subscriptions (Edge Case)**: Using a user with zero tag
   subscriptions, open a new tab. Expect the explanatory empty state, not a
   blank list.
7. **Revoked (User Story 3)**: From `/settings/connections`, revoke the
   extension's connection. Open a new tab. Expect the "Connect account"
   prompt again, not a broken feed or raw error.
8. **Offline (User Story 3)**: Disconnect network, open a new tab. Expect a
   clear offline message with retry, not a blank page or console exception.
9. **Cross-browser (SC-003)**: Repeat steps 1-8 in both Chrome and Firefox.

## Expected outcome

All 9 steps behave as described in both browsers. Any blank page,
unhandled exception, or browser-specific divergence beyond the manifest is
a defect against FR-004/FR-005/FR-008/SC-003/SC-004.
