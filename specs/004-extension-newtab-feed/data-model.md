# Data Model: Browser Extension New-Tab Subscribed-Tags Feed

No new persisted entities. This feature is a new read surface over existing
data (`Post`, `Tweet`, `Tag`, `Subscription` — all already modeled in
`prisma/schema.prisma`) plus the specs/003 `ExtensionToken` for auth.

## Extension Feed Item (response shape, not a database entity)

See `contracts/feed-api.md` for the exact JSON shape — it is the existing
`FeedItem` union (`src/actions/timeline.ts`) serialized over HTTP, filtered
to the caller's subscribed tags via `Subscription`.

## Client-side (extension) state

Not a data model in the schema sense, but worth naming since it's the
extension's only persisted state:

| Key (in `browser.storage.local`) | Type | Notes |
|-----------------------------------|------|-------|
| `accessToken` | `string \| undefined` | The specs/003 bearer token; absent means "not connected." |
| `lastFeedSnapshot` | `{ items, fetchedAt }` | Optional cache so the new tab can render instantly (SC-001) before the background refresh completes; not a source of truth. |
