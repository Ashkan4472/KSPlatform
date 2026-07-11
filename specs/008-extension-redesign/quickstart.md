# Quickstart: Validate Extension New-Tab Visual Redesign

## Prerequisites

- specs/004 (the extension) already implemented and working
- `cd extension && npm install`

## Type-check and lint gate

```bash
cd extension
npx tsc --noEmit
npm run lint
```

## Manual smoke test

1. **Populated feed (US1)**: With a connected, subscribed account, open a
   new tab. Confirm each item shows a colored spine and tag label, and
   hovering an item shows a visible response (rail thickens / row shifts).
2. **Tag color consistency (SC-002)**: Note a tag's color in the web app
   feed, then confirm the same tag shows the same color in the extension.
3. **Empty state (US2)**: With a connected account that has zero
   subscriptions, open a new tab. Confirm the empty-state message uses the
   same visual language (typography, color) as the populated feed, not a
   plain unstyled message.
4. **Disconnected/offline (US2)**: Revoke the connection (or disconnect
   network) and open a new tab. Confirm the connect/offline prompt is
   visually consistent with the redesign.
5. **Reduced motion (FR-004)**: Enable OS-level reduce-motion, repeat
   steps 1 and 4 — confirm no hover/ambient animation plays, but hover
   states still register visually (e.g. as an instant style change) and
   everything still functions.
6. **Cross-browser (SC-005)**: Repeat steps 1-4 in both Chrome and
   Firefox — confirm identical visual result in both.
7. **No functional regression (FR-005)**: Confirm every specs/004
   acceptance scenario (connect flow, pagination, click-through,
   revoke/offline fallback) still behaves exactly as before — only the
   visuals changed.

## Expected outcome

All 7 steps match their description. A missing hover response, a color
mismatch with the web app, an unstyled empty/offline state, or any
functional regression from specs/004 is a defect against the
corresponding FR/SC.
