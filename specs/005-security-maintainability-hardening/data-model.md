# Data Model: Security & Maintainability Hardening

No new or changed persisted entities — this is a pure code refactor over
the existing `User.role` field (`Role` enum: `USER | ADMIN`, unchanged in
`prisma/schema.prisma`).

## canModerate (function, not an entity)

`canModerate(user: { role: "USER" | "ADMIN" } | null | undefined): boolean`

Returns `user?.role === "ADMIN"`. Takes any object with a `role` field
(a full session user, a `Prisma.User`, or a small `{ role }` literal at
call sites that only have the role, not the whole user) so every existing
call site can adopt it without first fetching more data than it already
has.
