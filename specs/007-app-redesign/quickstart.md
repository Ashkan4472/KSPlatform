# Quickstart: Validate Visual Redesign & Settings Completeness

## Prerequisites

- Docker stack or local dev server running
- A browser with View Transitions support (current Chrome/Edge) and one
  without (or DevTools flag disabled) for SC-007's fallback check
- OS-level "reduce motion" setting available for testing FR-009/SC-006

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

## Manual smoke test

1. **Redesigned feed (US1)**: Load `/` as a never-customized (fresh)
   account. Confirm cards show a tag-colored spine, filled tag pills, and
   a distinct serif heading typeface — with zero manual setup.
2. **Tag color consistency (SC-002)**: Confirm the same tag renders the
   same color on the feed, on a post/tweet detail page, and in the tag
   pill row — and confirm (via `psql` or Prisma Studio) that `Tag` still
   has no `color` column.
3. **Customization untouched (US1 scenario 3)**: Change any of the 9
   existing appearance settings (e.g. accent → "Blue," radius → "Large").
   Confirm it applies exactly as it did before this feature, on top of
   the new defaults.
4. **Change password (US2)**: From settings, change your password with
   the correct current password; log out; log back in with the new one
   only. Then attempt a change with a wrong current password — confirm
   rejection with a clear error.
5. **Notification toggle (US3)**: Disable notifications; from a second
   account, publish content tagged with something the first account
   subscribes to. Confirm no new `Notification` row for the first account,
   but confirm the content still appears in their subscribed-tags feed.
6. **Delete account (US4)**: As a disposable test account with a post, a
   tweet, and a comment, delete the account through the two-step
   confirmation. Confirm login now fails and none of their content is
   visible anywhere.
7. **Interaction polish (US5)**: Like a post (animated confirmation);
   expand a comment thread (animated reveal); throttle network to see the
   loading shimmer; trigger a toast-worthy action (e.g. bookmark) and
   watch it appear and self-dismiss.
8. **Reduced motion (FR-009/SC-006)**: Enable OS-level reduce-motion,
   repeat step 7 — confirm every end state still occurs (liked, expanded,
   loaded, toasted) but with no animation.
9. **Page transition (US6)**: In a View-Transitions-capable browser,
   click from the feed into a post and back — confirm an animated
   crossfade/slide. In a browser without support (or with the flag off),
   repeat — confirm instant, fully correct navigation with no errors.

## Expected outcome

Every step matches its description. Any mismatch (customization broken,
a `color` column present, wrong-password acceptance, stale notifications
after opt-out, surviving content after deletion, missing reduced-motion
fallback, a broken transition) is a defect against the corresponding
FR/SC.
