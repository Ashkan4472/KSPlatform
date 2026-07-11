# Quickstart: Validate ActionResult Consolidation

## Prerequisites

- Docker stack running: `docker compose up --build` (app on `localhost:3000`)
- Logins: `demo@ksplatform.dev` / `password123` (user), `admin@ksplatform.dev` /
  `password123` (admin)

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

Both MUST pass with no new errors/warnings (SC-002).

## Manual smoke test (SC-003)

1. **Post error path**: As `demo@ksplatform.dev`, submit the post-create form
   with an empty title. Expect the same validation error toast as before the
   change.
2. **Post success path**: Create a post with a valid title/body. Expect it to
   appear in the feed, no error toast.
3. **Comment**: Add a comment to a post, then delete it. Expect no error
   toast on either action.
4. **Tweet**: Create a tweet, then delete it. Expect no error toast.
5. **Profile update**: As `demo@ksplatform.dev`, update profile info (the
   action using the `{ error?; ok? }` variant). Confirm the success
   indicator (`ok`) still drives the same UI feedback as before.
6. **Admin moderation**: As `admin@ksplatform.dev`, delete another user's
   post, tweet, and the user itself from `/admin`. Expect each row to
   disappear from the admin list with no error toast.

## Expected outcome

No behavioral difference from pre-refactor: this is a type-only change
(FR-005). Any observed difference in toast text, timing, or success/failure
handling is a regression.
