# Data Model: Consolidate Duplicate ActionResult Type

## ActionResult

The shared mutation-result contract returned by server actions in
`src/actions/*` that report success/failure to a client component (which
toasts on `error`).

| Field   | Type     | Required | Notes |
|---------|----------|----------|-------|
| `error` | `string` | No       | Present when the action failed; client toasts this message. |
| `ok`    | `boolean`| No       | Present only where a caller distinguishes an explicit success signal beyond "no error" (currently only `profile.ts`). |

**Relationships**: Returned by `createPostAction`, `updatePostAction`,
`deletePostAction`, `adminDeletePost`, `adminDeleteTweet`, `adminDeleteUser`,
`addCommentAction`, `deleteCommentAction`, the tweet create/delete actions,
and the profile update action. No relationship to Prisma models — this is a
UI-facing result contract, not a persisted entity.

**Validation rules**: None beyond TypeScript structural typing — both fields
are optional, so every existing call site (whether it sets `ok` or not)
remains valid against the shared type without modification.

**State transitions**: N/A — not a stateful entity.
