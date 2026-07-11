# Quickstart: Validate Security & Maintainability Hardening

## Prerequisites

- Docker stack or local dev server running
- Logins: `demo@ksplatform.dev` (user), `admin@ksplatform.dev` (admin) — both `password123`

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

## Manual smoke test (SC-003)

For each of the following, compare behavior as `demo@ksplatform.dev` (no
moderation controls expected) vs `admin@ksplatform.dev` (moderation
controls expected) — behavior must be identical to before this change:

1. Home feed (`/`) — admin sees delete controls on posts/tweets, regular
   user doesn't.
2. A post page (`/posts/[slug]`) — same.
3. A profile page (`/u/[id]`) — admin badge shown correctly; moderation
   controls shown correctly.
4. Search (`/search`) — moderation controls in results match role.
5. Tweets feed (`/tweets`) and a tweet detail page — same.
6. Navbar user menu — admin-only links (e.g. `/admin`) shown only for admin.
7. `/admin` itself — admin badges on rows match each row's actual role.
8. People directory — admin badge on cards matches role.
9. Settings → Appearance: change any preference as both a signed-in user
   and (in a private/incognito tab) while signed out — signed-in save
   persists, signed-out is a no-op, exactly as before.

## Expected outcome

No visible difference in any of the above compared to the pre-refactor
behavior. Any difference is a regression.
