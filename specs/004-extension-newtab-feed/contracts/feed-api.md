# Contract: GET /api/v1/feed

Under the versioned external-client surface (Constitution Principle VII).
Requires the bearer token from specs/003.

## Request

```
GET /api/v1/feed?cursor=<opaque-cursor-or-absent>
Authorization: Bearer <access_token>
```

## Response `200`

Reuses the shape of `Page<FeedItem>` (`src/lib/pagination.ts`,
`src/actions/timeline.ts`), JSON-serialized (dates as ISO strings):

```json
{
  "items": [
    {
      "kind": "post",
      "sortAt": "2026-07-11T08:00:00.000Z",
      "post": {
        "id": "...", "slug": "...", "title": "...", "excerpt": "...",
        "publishedAt": "2026-07-11T08:00:00.000Z",
        "author": { "id": "...", "name": "...", "image": null },
        "tags": [{ "name": "rust", "slug": "rust" }],
        "likeCount": 3, "commentCount": 1
      }
    },
    {
      "kind": "tweet",
      "sortAt": "2026-07-11T07:55:00.000Z",
      "tweet": {
        "id": "...", "body": "...", "imageUrl": null,
        "author": { "id": "...", "name": "...", "image": null },
        "tags": [{ "name": "typescript", "slug": "typescript" }],
        "likeCount": 0, "commentCount": 0
      }
    }
  ],
  "nextCursor": "2026-07-11T07:55:00.000Z"
}
```

Filtering: items MUST be restricted to tags the bearer token's owning user
is subscribed to (`Subscription` rows) — this is the one behavioral
difference from the web app's `loadTimeline`, which defaults to "all" or
"subscribed" via an explicit filter param already; this endpoint always
behaves as `filter: "subscribed"` and requires no filter param.

Empty subscriptions: `items: []`, `nextCursor: null` — the extension's
`App.tsx` renders the FR-007 empty state, not the server.

## Response `401`

```json
{ "error": "reauthenticate_required" }
```

Returned for a missing, invalid, expired, or revoked token — the same
signal defined in specs/003's contract, reused verbatim (not a second,
slightly-different auth error shape).

## Response `429`

Standard rate-limit response, same shape as specs/003's device endpoints,
should the extension poll too aggressively (defensive; normal new-tab usage
patterns are far below any reasonable threshold).
