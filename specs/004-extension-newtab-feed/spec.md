# Feature Specification: Browser Extension New-Tab Subscribed-Tags Feed

**Feature Branch**: `004-extension-newtab-feed`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Build a browser extension, similar to
daily.dev, that replaces the browser's new-tab page so a logged-in user
sees a feed of posts (and, per clarification, tweets too — unified) from
the tags they subscribe to on KSPlatform. Targets Chrome and Firefox from
day one. Lives in a new top-level extension/ directory in this repo.
Depends on specs/003 for authentication (device-flow bearer token, no
password ever entered in the extension)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See subscribed-tag content on every new tab (Priority: P1)

As a KSPlatform user who subscribes to specific tags, I want every new
browser tab to show me a scrollable feed of the latest posts and tweets
tagged with my subscriptions, so I catch up on topics I care about without
opening KSPlatform separately.

**Why this priority**: This is the entire value proposition — without a
working feed, the extension is just an empty new-tab page.

**Independent Test**: With the extension installed and connected (per
specs/003), open a new tab and see a feed of recent posts/tweets matching
the signed-in user's subscribed tags, matching what `/` shows on the web
app filtered to those tags.

**Acceptance Scenarios**:

1. **Given** a connected user subscribed to tags "rust" and "typescript",
   **When** they open a new tab, **Then** they see recent posts and tweets
   tagged "rust" or "typescript", newest first.
2. **Given** a connected user with no tag subscriptions, **When** they open
   a new tab, **Then** they see an empty state explaining how to subscribe
   to tags on KSPlatform (not a blank page or an error).
3. **Given** the user scrolls to the bottom of the feed, **When** more
   items exist, **Then** additional pages load (infinite scroll, consistent
   with the web app's existing pattern).
4. **Given** a post or tweet in the feed, **When** the user clicks it,
   **Then** it opens the corresponding KSPlatform page in a new tab (the
   extension is a feed surface, not a content viewer/editor).

---

### User Story 2 - Not connected yet (Priority: P2)

As a user who just installed the extension, I want a clear path to connect
my KSPlatform account from the new-tab page itself, so I don't have to hunt
for how to get started.

**Why this priority**: Without this, User Story 1 is unreachable for a
fresh install — but it's P2 because it's a thin wrapper around specs/003's
already-specified connect flow, not new product value on its own.

**Independent Test**: Install the extension fresh (no prior connection),
open a new tab, see a "Connect your KSPlatform account" prompt, complete
the specs/003 device flow, and see the prompt replaced by the real feed on
the next new tab.

**Acceptance Scenarios**:

1. **Given** a freshly installed, unconnected extension, **When** the user
   opens a new tab, **Then** they see a "Connect account" call-to-action
   instead of a feed or an error.
2. **Given** the user completes the connect flow in another tab, **When**
   they open a subsequent new tab, **Then** the feed now loads (no manual
   refresh/restart of the browser required).

---

### User Story 3 - Falls back gracefully when disconnected or offline (Priority: P3)

As a user whose extension token was revoked (or who has no network), I want
the new-tab page to still be usable (e.g. browser's default new-tab
behavior or a clear reconnect prompt), so a broken connection never blocks
me from opening a new tab.

**Why this priority**: A polish/resilience concern — real, but lower
priority than the feed actually working (P1) or the initial connect flow
(P2).

**Independent Test**: Revoke the extension's token from KSPlatform account
settings, then open a new tab; separately, disconnect network and open a
new tab.

**Acceptance Scenarios**:

1. **Given** a revoked token (per specs/003 FR-006's
   `reauthenticate_required` signal), **When** the user opens a new tab,
   **Then** they see the same "Connect account" prompt as User Story 2, not
   a raw error.
2. **Given** no network connectivity, **When** the user opens a new tab,
   **Then** they see a clear offline message with a retry option, not a
   blank or broken page.

### Edge Cases

- What happens when a subscribed tag is deleted or renamed on KSPlatform?
  The feed simply stops showing items for it going forward — no special
  handling needed, matches the web app's existing behavior when a tag's
  content changes.
- What happens if the user has dozens of tag subscriptions? The feed is a
  single unified, newest-first list across all subscribed tags (no per-tag
  sectioning in v1) — matches the "unified timeline" pattern already used
  by the web app's home feed.
- What happens on very slow connections? The feed shows a loading state
  first, consistent with the web app's existing infinite-scroll loading
  indicator pattern, not a spinner-free blank page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST override the browser's new-tab page in
  both Chrome and Firefox.
- **FR-002**: The new-tab page MUST show a unified (posts + tweets),
  newest-first, infinite-scroll feed restricted to the signed-in user's
  subscribed tags.
- **FR-003**: The extension MUST NOT require or accept an email/password —
  all authentication flows through the specs/003 device flow.
- **FR-004**: When not connected (never connected, or a revoked/expired
  token), the new-tab page MUST show a "Connect account" prompt instead of
  an empty feed or an unhandled error.
- **FR-005**: When offline, the new-tab page MUST show a clear offline
  state with a retry action, not a blank page or unhandled exception.
- **FR-006**: Clicking any feed item MUST open the corresponding KSPlatform
  post/tweet page in a new browser tab.
- **FR-007**: A user with zero tag subscriptions MUST see an explanatory
  empty state, not a blank list.
- **FR-008**: The same feed experience and codebase MUST work in both
  target browsers (Chrome and Firefox) without maintaining two divergent
  implementations of the feed logic itself (only the manifest/platform glue
  may differ).

### Key Entities

- **Extension Feed Item**: A post or tweet, as already modeled by the web
  app's unified timeline (`FeedItem` in `src/actions/timeline.ts`),
  rendered in a browser-extension-appropriate compact card — no new content
  entity, this feature is a new read surface over existing data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A connected user opening a new tab sees their subscribed-tag
  feed content within 2 seconds on a normal broadband connection.
- **SC-002**: 100% of feed items link to a working KSPlatform page when
  clicked.
- **SC-003**: The extension functions (installs, connects, shows feed)
  identically in Chrome and Firefox — verified manually in both before this
  feature is considered done.
- **SC-004**: A disconnected or offline state never results in a blank page
  or an unhandled JavaScript error in the new-tab context (measured by
  manual testing of both conditions in both target browsers).

## Assumptions

- Depends entirely on specs/003 (device-flow auth) being implemented first;
  this spec assumes that feature's contracts (`/api/v1/device/*`, the
  bearer-token verification helper) already exist.
- This feature adds exactly one new read endpoint,
  `GET /api/v1/feed?cursor=...`, under the same Principle VII external-
  client surface, returning the subscribed-tags-filtered unified feed,
  paginated the same way the web app's `loadTimeline` already is.
- "Extension" here means a Manifest V3 WebExtension; Firefox's MV3 support
  (Firefox 109+) is assumed sufficient — no Manifest V2 fallback is built.
- No write/interaction features (like, save, comment) ship in this version
  — confirmed via clarification ("Posts + tweets, unified" read-only scope).
- Styling/branding of the new-tab page is a KSPlatform-consistent but
  extension-appropriate compact layout — not a pixel-identical copy of the
  web app's timeline UI.
