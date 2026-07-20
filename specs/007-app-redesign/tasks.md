---

description: "Task list for feature implementation"
---

# Tasks: Visual Redesign & Settings Completeness ("Index & Ink")

**Input**: Design documents from `/specs/007-app-redesign/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: No unit test tasks generated; verification is the manual
quickstart plus the standard type-check/lint gate — this is primarily a
styling/default-value change plus additive settings features with no
complex new business logic to unit-test.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Add `notificationsEnabled Boolean @default(true)` to `User` in
  `prisma/schema.prisma`; run
  `npm run db:migrate -- --name add_notifications_enabled` (check for
  spurious `pg_trgm` index drops per CLAUDE.md); run `npx prisma generate`
- [X] T002 [P] Create `src/lib/tagColor.ts`: `TAG_PALETTE` (6 keys
  `tag-1`..`tag-6`), `tagColorVar(slug: string): string` per data-model.md
- [X] T003 [P] In `src/app/globals.css`: add `--tag-1` through `--tag-6`
  custom properties for both the default `:root` and the dark-mode block
  (6 distinct hues, matching the approved mockup palette); add
  `@keyframes shimmer`, `@keyframes pop`, `@keyframes marquee` (or reuse
  `tw-animate-css` utilities where they already cover the same motion)

---

## Phase 2: Foundational

**Purpose**: Default-value changes that every visual user story sits on
top of.

- [X] T004 In `src/lib/fonts.ts`: change `DEFAULT_ACCENT` to `"violet"`,
  `DEFAULT_RADIUS` to `"small"`, `DEFAULT_CARD_STYLE` to `"elevated"`
  (all three are pre-existing preset values — this only changes which one
  new/reset accounts start with; the picker and every other preset are
  unaffected)
- [X] T005 In `src/app/globals.css`: change the default `--font-heading`
  mapping from `var(--font-sans)` to `var(--font-source-serif)` (the
  already-loaded Source Serif font) — independent of the user-customizable
  `font` axis, which still controls `--font-sans` only

**Checkpoint**: A fresh account's default appearance now uses the new
accent/radius/card-style/heading-font combination. `npx tsc --noEmit`
passes. Existing customized accounts are unaffected (their stored
axis values still override these defaults, unchanged mechanism).

---

## Phase 3: User Story 1 - The reading surfaces look considered (Priority: P1) 🎯 MVP

**Goal**: Feed cards show the spine + filled tag pills + serif headings;
tag color is consistent everywhere.

**Independent Test**: quickstart.md steps 1-3.

### Implementation for User Story 1

- [X] T006 [P] [US1] `src/components/feed/PostCard.tsx`: add a
  tag-colored left spine (a 4-6px accent bar using `tagColorVar(post.tags[0]?.slug)`,
  falling back to the theme's `--border` if no tags), change tag `Badge`
  rendering to a filled/tinted style using `tagColorVar(tag.slug)`, apply
  `text-wrap: balance`-equivalent Tailwind class to the title
- [X] T007 [P] [US1] `src/components/tweets/TweetCard.tsx`: same spine +
  filled-tag-pill treatment as T006
- [X] T008 [P] [US1] `src/components/feed/TrendingTags.tsx`: render each
  trending tag chip filled/tinted via `tagColorVar(tag.slug)`, matching
  the approved mockup's trending-strip look
- [X] T009 [US1] `src/components/InfiniteList.tsx`: add a `loading`
  prop/slot rendering shimmering skeleton placeholders (using T003's
  shimmer keyframe) while `loadMore` is in flight, instead of no visual
  feedback
- [X] T010 [US1] Verify (manual): with `prefers-reduced-motion` enabled,
  confirm the shimmer and any new hover-lift transitions from T006-T008
  don't animate (guarded by a shared `@media (prefers-reduced-motion: reduce)`
  rule added once in `globals.css`, not per-component)

**Checkpoint**: quickstart.md steps 1-3 pass. SC-001, SC-002 achievable.

---

## Phase 4: User Story 2 - Change your password (Priority: P1)

**Goal**: Self-service password change from settings.

**Independent Test**: quickstart.md step 4.

### Implementation for User Story 2

- [X] T011 [US2] Add `changePasswordSchema` to `src/lib/validation.ts`
  (current password required non-empty; new password reuses
  `signupSchema`'s password rule)
- [X] T012 [US2] Create `src/actions/accountSettings.ts` with
  `changePasswordAction(_prev, formData)`: `requireUserId()`, validate,
  fetch the user's `passwordHash`, `bcrypt.compare` the current password
  (reject with a clear error if it doesn't match), hash and persist the
  new password
- [X] T013 [US2] Create `src/components/settings/AccountSettings.tsx`
  (or extend the existing settings page) with a change-password form
  (current password, new password, confirm) wired to T012, and add it to
  `src/app/settings/page.tsx`

**Checkpoint**: quickstart.md step 4 passes. SC-003 achievable.

---

## Phase 5: User Story 3 - Turn off notifications for new tagged content (Priority: P2)

**Goal**: A single toggle stops new `Notification` rows without touching
subscriptions.

**Independent Test**: quickstart.md step 5.

### Implementation for User Story 3

- [X] T014 [US3] In `src/actions/accountSettings.ts`: add
  `toggleNotificationsAction(enabled: boolean)` — `requireUserId()`,
  update `User.notificationsEnabled`, `revalidatePath("/settings")`
- [X] T015 [US3] In `src/lib/tagging.ts`'s `notifySubscribers()`: filter
  the subscriber list to `where: { ..., user: { notificationsEnabled: true } }`
  (or an equivalent post-query filter) before creating `Notification` rows
- [X] T016 [US3] Add the notification toggle UI to
  `src/components/settings/AccountSettings.tsx` (or the settings page),
  wired to T014

**Checkpoint**: quickstart.md step 5 passes. SC-004 achievable.

---

## Phase 6: User Story 4 - Delete your own account (Priority: P2)

**Goal**: Two-step self-service account deletion.

**Independent Test**: quickstart.md step 6.

### Implementation for User Story 4

- [X] T017 [US4] In `src/actions/accountSettings.ts`: add
  `deleteAccountAction()` — `requireUserId()`, `prisma.user.delete()`
  (cascades remove posts/tweets/comments/likes/bookmarks/subscriptions
  per existing `onDelete: Cascade` relations), then sign the session out
- [X] T018 [US4] Add a delete-account section to
  `src/components/settings/AccountSettings.tsx` using the existing
  `ConfirmDialog` component (two-step: dialog confirm, then the action)

**Checkpoint**: quickstart.md step 6 passes. SC-005 achievable.

---

## Phase 7: User Story 5 - The app responds to what you do (Priority: P2)

**Goal**: Animated like confirmation, expandable comments, toast feedback.

**Independent Test**: quickstart.md steps 7-8.

### Implementation for User Story 5

- [X] T019 [P] [US5] `src/components/posts/PostActions.tsx` (and the
  tweet equivalent, if separate): add a scale/color-pop animation on
  `toggleLikeAction` success (CSS transition on the heart icon's `checked`/
  liked state), respecting `prefers-reduced-motion`
- [X] T020 [P] [US5] `src/components/comments/CommentItem.tsx` (or the
  thread container): make the reply/child-comment disclosure animate open/
  closed (CSS grid-rows or max-height transition) instead of an instant
  toggle
- [X] T021 [US5] Confirm existing `sonner` toast usage already provides
  slide-in/out animation (per `CLAUDE.md`, toasts come from `sonner`); if
  the default animation doesn't match the approved direction's timing,
  adjust via `sonner`'s theming props — do not replace the toast library
  (Principle I)

**Checkpoint**: quickstart.md steps 7-8 pass. SC-006 achievable.

---

## Phase 8: User Story 6 - Feed↔post transition (Priority: P3)

**Goal**: Animated navigation between the feed and a post/tweet detail
page, with graceful fallback.

**Independent Test**: quickstart.md step 9.

### Implementation for User Story 6

- [X] T022 [US6] In `next.config.ts`: add `experimental: { viewTransition: true }`
- [X] T023 [US6] Wrap the relevant feed-card-to-detail-page shared element
  (e.g. the post title, or the card itself) in React's `<ViewTransition
  name="post-{id}">` in both `src/components/feed/PostCard.tsx` (grid
  context) and `src/app/posts/[slug]/page.tsx` (detail context), per the
  Next.js docs' shared-element pattern; repeat for the tweet equivalent if
  distinct

**Checkpoint**: quickstart.md step 9 passes (animates where supported,
degrades cleanly where not). SC-007 achievable.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T024 Run `npx tsc --noEmit` (SC-008)
- [X] T025 Run `npm run lint` (SC-008)
- [X] T026 Run the full `quickstart.md` manual smoke test (all 9 steps)

---

## Dependencies & Execution Order

- **Setup (T001-T003)**: No dependencies among them; T001 (migration) is
  independent of T002/T003 (pure code/CSS).
- **Foundational (T004-T005)**: Depends on Setup only for T003's tokens
  existing (T005 references `--font-source-serif`, already loaded
  independent of this feature).
- **User Story 1 (T006-T010)**: Depends on Foundational + T002 (tagColor).
  T006-T008 parallel (different files); T009 independent; T010 is a
  verification step depending on all of them.
- **User Story 2 (T011-T013)**: Depends on Setup only (no dependency on
  US1's visual changes).
- **User Story 3 (T014-T016)**: Depends on T001 (schema column). T015 can
  proceed in parallel with T012's action file existing, since they touch
  different files.
- **User Story 4 (T017-T018)**: Depends on US2/US3's `AccountSettings.tsx`
  existing (T013/T016) since T018 adds to the same file — sequential
  within that file in practice.
- **User Story 5 (T019-T021)**: Depends on Foundational (motion tokens)
  only, independent of US2-US4.
- **User Story 6 (T022-T023)**: Depends on Foundational only.
- **Polish (T024-T026)**: Depends on all user stories.

## Parallel Example: User Story 1

```bash
Task: "Add spine + filled tag pills to PostCard.tsx"
Task: "Add spine + filled tag pills to TweetCard.tsx"
Task: "Filled trending-tag chips in TrendingTags.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (T001-T005)
2. User Story 1 (T006-T010)
3. **STOP and VALIDATE**: quickstart.md steps 1-3 — redesigned feed,
   consistent tag color, existing customization unaffected

### Incremental Delivery

1. Setup + Foundational → new defaults live
2. US1 → visual redesign of reading surfaces
3. US2 → change password
4. US3 → notification toggle
5. US4 → account deletion
6. US5 → interaction polish
7. US6 → page transitions
8. Polish → full verification

## Notes

- No test-writing tasks: this feature is almost entirely styling/default
  changes plus three small, independently simple server actions —
  verification is the manual quickstart plus the type-check/lint gate.
- US2-US4 (settings features) are independent of US1/US5/US6 (visual/
  motion) and could be built by a different person/session in either
  order.
- **Deviations during US1**: T003's `@keyframes marquee` was not added —
  no in-scope task actually needed an auto-scrolling strip (only the
  mockup's bonus trending-tags treatment did, not a formal requirement);
  added `@keyframes shimmer` and `@keyframes like-pop` instead (named
  `like-pop`, not `pop`, for clarity at the call site). `DEFAULT_ACCENT`/
  `DEFAULT_RADIUS`/`DEFAULT_CARD_STYLE` reuse pre-existing preset values
  (`violet`/`small`/`elevated`) rather than inventing new ones — verified
  visually in a real browser (Playwright) in both light and dark mode
  before considering US1 done, per the "verify in a browser" project
  convention: spine color, filled tag pills, and the serif heading font
  (`Source Serif 4`, confirmed via computed style, not just visually) all
  render correctly, zero console errors.
- **Deviations during US5**: T021 required no code change — `sonner`'s
  default slide/fade timing already matches; verified only. T020's reply
  disclosure keeps the `CommentForm` conditionally mounted (not
  permanently), so the grid-rows wrapper is always rendered but its child
  mounts/unmounts with `replying` — this means `autoFocus` still fires on
  every open (mount), and the 200ms open animation plays since the height
  is already known at the moment the child appears; the close animation
  collapses an already-emptied gap (acceptable trade-off, avoids a bigger
  ref-based refactor for a P2 polish item). Verified live in the browser:
  like-pop class applies zero console errors on toggle, reply-form
  `grid-template-rows` transitions 0fr→1fr on open (confirmed via computed
  style), toast dialogs still animate via `sonner`.
- **Deviations during US6**: `TweetCard.tsx` is rendered identically in
  both the feed and `/tweets/[id]`, so the whole `Card` is wrapped in one
  `<ViewTransition name={\`tweet-${tweet.id}\`}>` (a single shared element)
  rather than only the title, since a tweet has no separate title field
  the way a post does. Verified live in the browser (post title click,
  tweet timestamp click): both navigate correctly, zero console errors,
  `Experiments: viewTransition` confirmed active in the dev server log
  after a restart (config change requires one, same as any `next.config.ts`
  edit).
- **Polish run**: full `quickstart.md` (all 9 steps) verified live in the
  browser — `Tag` table confirmed via `psql` to still have no `color`
  column; password change tested both ways (wrong current password
  rejected with a clear error and no mutation, correct change then
  verified by logging in with the new password, then reverted back to the
  seed password); disposable-account deletion tested end-to-end with a
  throwaway signup (post + tweet + comment created, account deleted,
  post URL now 404s, feed no longer lists the content, login with the old
  credentials now returns "Invalid email or password"). Reduced-motion
  fallback (step 8) verified at the code level — the shared
  `@media (prefers-reduced-motion: reduce)` guard in `globals.css` and the
  per-component `motion-reduce:` Tailwind variants — rather than toggling
  the OS setting in this sandboxed browser session.
