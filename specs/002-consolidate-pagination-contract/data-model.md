# Data Model: Consolidate Duplicate Cursor-Pagination Contract

## Page&lt;T&gt;

The shared generic pagination-result contract.

| Field        | Type                | Required | Notes |
|--------------|---------------------|----------|-------|
| `items`      | `T[]`                | Yes      | The page's items, of whatever entity type the caller specifies. |
| `nextCursor` | `string \| null`      | Yes      | Cursor for the next page, or `null` when the list is exhausted. |

**Relationships**: Returned by `InfiniteList`'s `loadMore` prop and by every
paginated server action: `adminListUsers/Posts/Tweets`, `loadMoreUsers`,
`loadUserPosts/Tweets` (profile), `searchPosts/Tweets`, `loadMoreTweets`,
`loadTimeline`. Replaces `Page<T>` (InfiniteList.tsx, admin.ts), `UserPage`,
`ProfilePostPage`, `ProfileTweetPage`, `PostSearchPage`, `TweetSearchPage`,
`TweetPage`, `TimelinePage`.

**Validation rules**: None beyond structural typing — every existing usage
already matches this exact shape (verified: all 9 declarations are
byte-identical modulo the item type parameter).

## idCursorArgs helper

Not an entity — a pure function `idCursorArgs(cursor?: string | null) =>
{} | { skip: 1; cursor: { id: string } }`, replacing the inline
`...(cursor ? { skip: 1, cursor: { id: cursor } } : {})` spread duplicated in
`admin.ts` (3x) and `profileFeed.ts` (2x). Scoped only to id-ordered cursor
queries; `search.ts` (offset-based) and `timeline.ts` (ISO-timestamp-based)
keep their own cursor construction (FR-004).
