# Feature Specification: Extension New-Tab Visual Redesign

**Feature Branch**: `008-extension-redesign`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "With the help of the frontend-design
approach, make the browser extension's new-tab UI more appealing and
engaging, since it's the surface users see most often. The current UI is
plain/unstyled. Direction approved via mockup iteration: the same 'Index &
Ink' identity as the main app redesign (specs/007) — computed tag colors,
a colored spine on each item, hover interactions, a pulsing unread
indicator, an ambient refresh glyph — so the extension and the web app
read as the same product."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The new-tab feed looks and feels like KSPlatform (Priority: P1)

As a user who opens dozens of new tabs a day, I want that page to look
considered and consistent with the KSPlatform brand, so it feels like a
feature I chose to install rather than a bare unstyled list.

**Why this priority**: This is the entire ask — the extension is
currently plain, and it's the single highest-frequency touchpoint a
connected user has with the product.

**Independent Test**: Load the extension's new-tab page with a populated
feed and compare against specs/004's original plain implementation — items
show a tag-colored spine, consistent typography, and hover feedback,
matching the approved mockup and the main app's visual identity.

**Acceptance Scenarios**:

1. **Given** a feed of posts and tweets with various tags, **When** the
   redesign ships, **Then** each item shows a colored spine and tag label
   computed the same way as the main app (same hash function, same
   palette intent) — a tag that's, say, blue on the web app reads as the
   same hue in the extension.
2. **Given** a user hovers a feed item, **When** the redesign ships,
   **Then** the item shows a hover response (the rail thickens, the row
   nudges, or an equivalent — matching the approved mockup) instead of no
   visual feedback at all.
3. **Given** `prefers-reduced-motion` is set, **When** the user views the
   new tab, **Then** none of the ambient/ping/hover animations play, while
   the feed itself still renders and functions correctly.

---

### User Story 2 - The empty/loading/offline states feel designed too (Priority: P2)

As a user with no subscriptions yet, a slow connection, or a disconnected
extension, I want those states to look like a deliberate part of the
product, not an unstyled fallback, so the extension never feels broken
even when there's nothing to show.

**Why this priority**: specs/004 already built these states functionally
(FR-004/FR-005 there); this spec is about making them visually consistent
with User Story 1, not building new states.

**Independent Test**: Trigger each of specs/004's existing states (no
subscriptions, disconnected, offline) and confirm each now uses the Index
& Ink visual language instead of unstyled default browser text/buttons.

**Acceptance Scenarios**:

1. **Given** a connected account with zero tag subscriptions, **When**
   the new tab loads, **Then** the empty state uses the same typography,
   color, and spacing language as the populated feed — not a plain
   unstyled message.
2. **Given** a disconnected or offline state, **When** the new tab loads,
   **Then** the connect/offline prompt is visually consistent with the
   rest of the redesign, including its call-to-action button styling.

### Edge Cases

- What happens if the extension can't reach the web app to know a tag's
  "real" color (e.g. offline)? Not applicable — tag color is computed
  locally from the slug already present in the feed response (specs/007's
  `tagColor()` logic, reimplemented in the extension per specs/004's
  established pattern of duplicating small, self-contained logic across
  the build boundary rather than sharing a build step). No network
  dependency for color.
- What happens on very small popup/window sizes? Out of scope — the
  extension only overrides the new-tab page (a full browser tab), not a
  toolbar popup, so there's no meaningfully constrained viewport to
  design for beyond normal responsive text wrapping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension's new-tab feed items MUST show a tag-colored
  spine and tag label, computed via the same hash-based approach as the
  main app (specs/007 FR-002) — reimplemented locally in the extension
  codebase, not fetched over the network.
- **FR-002**: A tag's computed color MUST be visually consistent between
  the main app and the extension (same palette, same mapping logic) so a
  user recognizes the same tag across both surfaces.
- **FR-003**: Feed items MUST provide a hover response (visual feedback on
  pointer hover), and the connect/offline/empty states from specs/004
  MUST be restyled to match the same visual language as the populated
  feed — no unstyled fallback screens.
- **FR-004**: All new animations/hover effects MUST respect
  `prefers-reduced-motion`, matching specs/007's FR-009 for the main app.
- **FR-005**: This redesign MUST NOT change any of specs/004's existing
  functional behavior (auth flow, feed fetching, pagination, click-through
  to source content) — it is a visual/styling change only.

### Key Entities

- **Extension Tag Color**: The extension-local reimplementation of
  specs/007's `tagColor()` function — same algorithm and palette intent,
  applied to the `FeedItem`/`FeedPost`/`TweetView` shapes already defined
  in `extension/src/lib/types.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The extension's new-tab page visually matches the approved
  mockup direction (spine, tag color, hover feedback, typography) for the
  populated-feed state.
- **SC-002**: A tag rendered in both the web app and the extension shows
  the same color.
- **SC-003**: The empty, connect-prompt, and offline states (from
  specs/004) are visually restyled to match, with zero change to their
  underlying trigger logic.
- **SC-004**: `npx tsc --noEmit` and `npm run lint` pass for the
  `extension/` sub-project.
- **SC-005**: Manual verification in both Chrome and Firefox (per
  specs/004's existing cross-browser requirement) shows the same visual
  result in both.

## Assumptions

- Depends on specs/004 (the extension itself) already being implemented —
  this spec only restyles existing states, it does not add new ones.
- The extension's styling remains plain CSS (per specs/004's plan
  decision not to wire Tailwind into the extension's separate Vite build)
  — this spec's tokens are expressed as extension-local CSS custom
  properties mirroring the main app's values, not a shared stylesheet.
- No new extension dependencies are introduced — this is a CSS/markup
  change to existing components (`App.tsx`, `FeedItem.tsx`, `styles.css`).
