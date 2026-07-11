# Feature Specification: Visual Redesign & Settings Completeness ("Index & Ink")

**Feature Branch**: `007-app-redesign`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Redesign the main application to make it
visually appealing. Better UX is a must, and add missing features in the
settings. The existing 9-axis appearance customization must not be
touched — users can still customize it — but the *default* visuals should
be more appealing. Direction approved via mockup iteration: 'Index & Ink' —
a library/index-card metaphor, tag color computed via a hash function (no
new database column), richer color, hover/motion interactions with a
purpose (loading shimmer, animated like, expandable comments, toasts,
pulsing notification indicators), and a page-to-page transition between
the feed and a post/tweet detail view. Missing settings features
(clarified): change password, notification preferences, account deletion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The reading surfaces look and feel considered, not generic (Priority: P1)

As anyone visiting KSPlatform for the first time, I want the feed, posts,
and tweets to look like a designed product with its own identity, so my
first impression isn't "generic gray dashboard template."

**Why this priority**: This is the actual ask — "make it visually
appealing" — and it's the highest-visibility surface (every visit touches
the feed).

**Independent Test**: Load the home feed as a brand-new (never customized)
user and compare against the current default — cards show a tag-colored
"spine," tags render as filled colored pills, typography uses a distinct
display face for titles, and the same tag always renders the same color
everywhere on the page.

**Acceptance Scenarios**:

1. **Given** a feed of posts and tweets with various tags, **When** the
   redesign ships, **Then** each card shows a colored spine and each tag
   pill is filled with a tint of that same color, computed from the tag's
   slug (not a stored value).
2. **Given** the same tag appears on two different cards, **When** the
   redesign ships, **Then** both cards show the identical color for that
   tag.
3. **Given** a user who has customized any of the 9 existing appearance
   axes (accent, radius, font, etc.), **When** the redesign ships,
   **Then** their customization still applies exactly as before — this
   redesign only changes *default* values, never the customization
   mechanism itself.
4. **Given** a user with `prefers-reduced-motion` enabled, **When** they
   use the app, **Then** no card-hover, loading, or transition animation
   plays (instant state changes instead).

---

### User Story 2 - Change your password from account settings (Priority: P1)

As a signed-in user, I want to change my password from settings, so I
don't need an administrator to do it for me.

**Why this priority**: A genuinely missing, security-relevant capability
— every account currently has no self-service path to rotate a
compromised or forgotten-but-still-logged-in password.

**Independent Test**: From settings, enter the current password and a new
one, submit, log out, and log back in with the new password only.

**Acceptance Scenarios**:

1. **Given** a signed-in user enters their correct current password and a
   valid new password, **When** they submit, **Then** the password is
   updated and a confirmation is shown.
2. **Given** a signed-in user enters an incorrect current password,
   **When** they submit, **Then** the change is rejected with a clear
   error and the password is unchanged.
3. **Given** a new password that doesn't meet the existing signup
   password rules, **When** submitted, **Then** it's rejected with the
   same validation message signup already uses (consistency, not a new
   rule set).

---

### User Story 3 - Turn off notifications for new tagged content (Priority: P2)

As a signed-in user, I want a way to stop receiving notifications for new
posts/tweets on tags I subscribe to, so I can keep using tag subscriptions
to curate my feed without also getting notified about every new item.

**Why this priority**: A real gap, but lower priority than P1s — the app
is fully usable without it, just noisier than necessary for some users.
Scoped to what the app actually has today: **exactly one** notification-
triggering event exists (`notifySubscribers` — new tagged content on a
subscribed tag). There is no separate "new comment" or "new subscriber"
notification to independently toggle; building a multi-type preferences UI
for a single real event type would be speculative, not a real gap.

**Independent Test**: Turn off notifications in settings, have a second
account publish a post/tweet tagged with something the first account
subscribes to, and confirm no notification is created — while the tag
subscription itself (and its effect on the subscribed-tags feed) is
unaffected.

**Acceptance Scenarios**:

1. **Given** a user disables notifications, **When** new content is
   published on a tag they subscribe to, **Then** no `Notification` row is
   created for them, but the content still appears in their subscribed-tags
   feed exactly as before (this only affects notifications, not
   subscriptions/feed filtering).
2. **Given** a user has made no changes, **When** they view notification
   settings, **Then** notifications default to enabled (matches today's
   always-on behavior — this is an opt-out, not an opt-in from nothing).

---

### User Story 4 - Delete your own account (Priority: P2)

As a signed-in user, I want to permanently delete my account and its
content, so I can leave the platform without contacting anyone.

**Why this priority**: A real gap and a reasonable privacy expectation,
but lower urgency than password changes — most users won't need it in a
given week.

**Independent Test**: As a test user with a post, a tweet, and a comment,
delete the account from settings (with a confirmation step), then confirm
the account can no longer log in and its content no longer appears
anywhere in the app.

**Acceptance Scenarios**:

1. **Given** a user requests account deletion, **When** they confirm
   (a deliberate second step, not a single click), **Then** their account,
   posts, tweets, comments, likes, and subscriptions are all removed.
2. **Given** an admin's own account, **When** they attempt self-deletion,
   **Then** the same confirmation flow applies — no special-casing beyond
   what already exists (an admin can still delete their own account; the
   app doesn't need a "last admin standing" guard for this spec).

---

### User Story 5 - The app responds to what you do (Priority: P2)

As a user, I want actions like liking a post, opening a comment thread, or
waiting for content to load to feel responsive and give clear feedback, so
the app feels alive rather than static.

**Why this priority**: Directly serves "better UX is a must" — this is
the interaction layer on top of User Story 1's visual layer.

**Independent Test**: Like a post and observe an animated confirmation;
open a comment thread and observe an animated reveal; trigger a
slow-loading feed and observe a shimmering placeholder instead of a blank
gap; perform an action that shows a toast (e.g. saving a bookmark) and
observe it appear and self-dismiss.

**Acceptance Scenarios**:

1. **Given** a user clicks the like control on a post, **When** the click
   registers, **Then** a brief animated confirmation plays and the count
   updates.
2. **Given** a post's comment count is visible but comments aren't yet
   shown, **When** the user clicks to expand them, **Then** they reveal
   with a smooth animated transition, not an instant jump.
3. **Given** a feed page is still loading its content, **When** the user
   is waiting, **Then** a shimmering placeholder is shown in place of each
   pending card, not a blank area.
4. **Given** any of the above, **When** `prefers-reduced-motion` is set,
   **Then** the end state still applies (like registers, comments expand,
   content loads) but without the animated transition.

---

### User Story 6 - Moving between the feed and a post feels connected (Priority: P3)

As a user, I want opening a post from the feed and returning to it to feel
like a continuous motion rather than an abrupt page swap, so navigation
feels considered rather than jarring.

**Why this priority**: The most polish-oriented, lowest-risk-if-deferred
story — real value, but the app is fully functional without it.

**Independent Test**: Click into a post from the feed and observe a
crossfade/slide transition (not an instant hard cut); click back and
observe the reverse.

**Acceptance Scenarios**:

1. **Given** a user clicks a post from the feed, **When** the post detail
   page loads, **Then** the transition animates (crossfade/slide) rather
   than replacing the page instantly.
2. **Given** `prefers-reduced-motion` is set, **When** the same navigation
   happens, **Then** the page changes instantly with no transition
   animation.
3. **Given** a browser that doesn't support the View Transitions API,
   **When** the same navigation happens, **Then** the app still works
   correctly, simply without the animation (graceful degradation, not an
   error).

### Edge Cases

- What happens when a tag's computed color collides with another tag's
  (the palette is a small fixed set, so this is expected)? No special
  handling needed — occasional shared colors across unrelated tags is an
  accepted tradeoff for zero storage cost (see Assumptions).
- What happens to a user's account-deletion request if they have pending,
  unread notifications or unresolved reports? Out of scope for this
  spec — deletion always proceeds (matches Constitution Principle VI: no
  speculative handling for a scenario without a demonstrated need).
- What happens to email notifications? Out of scope — there is currently
  no email-sending infrastructure in this app; "notification preferences"
  in this spec governs in-app `Notification` rows only (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app's default appearance (colors, typography, card
  layout) MUST change to the approved "Index & Ink" direction, while every
  existing customization axis (base, accent, size, font, surface, radius,
  card, border, shadow) MUST continue to function exactly as it does
  today for any user who has already set one.
- **FR-002**: Each tag's display color MUST be computed deterministically
  from its slug at render/query time — the system MUST NOT add a stored
  color field to the tag data model.
- **FR-003**: The same tag MUST render as the same color everywhere it
  appears (feed cards, tag pills, trending/tag-cloud surfaces, the
  browser extension).
- **FR-004**: Users MUST be able to change their password from account
  settings by providing their current password and a new one meeting the
  existing signup password policy.
- **FR-005**: Users MUST be able to enable/disable notifications for new
  tagged content on their own account (the app's one existing
  notification-triggering event), defaulting to enabled (no regression
  from today's always-on behavior). This MUST NOT change tag-subscription
  behavior itself (the subscribed-tags feed is unaffected).
- **FR-006**: Users MUST be able to permanently delete their own account
  and all owned content (posts, tweets, comments, likes, bookmarks,
  subscriptions) through a two-step confirmation flow.
- **FR-007**: Interactive elements (like, comment-thread disclosure,
  toggle switches) MUST provide an animated state-change confirmation, and
  loading states MUST show a shimmering placeholder instead of a blank
  gap, while a slow/failed load still degrades to a clear message (not a
  silent blank state).
- **FR-008**: Navigating from the feed to a post/tweet detail page (and
  back) MUST use an animated transition where the browser supports the
  View Transitions API, and MUST fall back to an instant, fully functional
  page change where it doesn't.
- **FR-009**: All new animations introduced by this spec MUST respect
  `prefers-reduced-motion` — the underlying state change (like registered,
  panel expanded, page navigated) MUST still occur, only the animation is
  skipped.

### Key Entities

- **Notification Preference**: A single per-user on/off setting governing
  whether the app's one existing notification-triggering event (new
  content on a subscribed tag) creates an in-app `Notification` row for
  that user. Does not affect the `Subscription` relationship itself.
- **Tag Color**: Not a stored entity — a pure function of a tag's slug,
  computed wherever a tag needs a display color.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor's feed shows the redesigned card
  style (spine, filled tag pills, display typography) with zero manual
  customization required.
- **SC-002**: Zero new columns are added to the `Tag` table for color;
  the same tag slug always resolves to the same color across every
  surface (web + extension).
- **SC-003**: A user can change their password and immediately use it to
  log back in after logging out.
- **SC-004**: Disabling notifications stops new `Notification` rows from
  being created for that user, while their tag subscriptions and
  subscribed-tags feed content remain completely unaffected.
- **SC-005**: A user can fully delete their account; none of their
  content remains visible or queryable afterward.
- **SC-006**: Like, comment-expand, loading, and toast interactions all
  show a visible animated confirmation with `prefers-reduced-motion`
  off, and an instant equivalent with it on.
- **SC-007**: Feed→post navigation animates in a View-Transitions-capable
  browser and works correctly (no error, no missing content) in one that
  isn't.
- **SC-008**: `npx tsc --noEmit` and `npm run lint` both pass.

## Assumptions

- "Notification preferences" governs in-app `Notification` rows only —
  there is no email-sending infrastructure in this app today, and adding
  one is out of scope for this spec.
- Tag color collisions (two unrelated tags sharing a hue from the small
  fixed palette) are an accepted tradeoff, not a defect — the alternative
  (storing a unique color per tag) is exactly what this spec's evidence
  gathering ruled out as unnecessary bloat.
- The approved visual direction (color palette, typography pairing,
  spine/rail signature, motion language) from the mockup review is the
  source of truth for FR-001's specific values — the implementation plan
  translates it into actual token values and component changes.
- View Transitions are additive progressive enhancement (FR-008); no
  functionality depends on the browser supporting them.
