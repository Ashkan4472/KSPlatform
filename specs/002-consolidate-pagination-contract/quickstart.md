# Quickstart: Validate Pagination Contract Consolidation

## Prerequisites

- Docker stack running: `docker compose up --build` (app on `localhost:3000`)
- Seed data present: `npm run db:seed` (or already seeded) so lists have
  enough rows to page through
- Login: `demo@ksplatform.dev` / `password123`; admin: `admin@ksplatform.dev`
  / `password123`

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

Both MUST pass with no new errors/warnings (SC-003).

## Manual smoke test (SC-004)

For each list below, scroll to the bottom and confirm the next page loads
with no console errors and no change in items shown vs. before the refactor:

1. **Home feed / tweets feed** (`/`, `/tweets`) — uses `loadTimeline` /
   `loadMoreTweets` (timestamp/id cursor, unaffected by the id-cursor helper
   but now uses the shared `Page<T>` type).
2. **People list** (`/people`) — uses `loadMoreUsers` (`UserPage` → `Page<T>`).
3. **Profile posts and tweets tabs** — uses `loadUserPosts`/`loadUserTweets`
   (`ProfilePostPage`/`ProfileTweetPage` → `Page<T>` + `idCursorArgs`).
4. **Search results** (posts and tweets tabs) — uses `searchPosts`/
   `searchTweets` (`PostSearchPage`/`TweetSearchPage` → `Page<T>`, offset
   cursor unchanged).
5. **Admin users/posts/tweets tables** (`/admin`) — uses
   `adminListUsers/Posts/Tweets` (`Page<T>` → shared `Page<T>` +
   `idCursorArgs`).

## Expected outcome

Every list above pages identically to before the change — same items, same
order, same stopping point. Any difference (missing items, duplicate items,
infinite-scroll never stopping) is a regression.
