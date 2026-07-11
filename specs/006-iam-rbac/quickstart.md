# Quickstart: Validate IAM Module

## Prerequisites

- Docker stack or local dev server running
- Two accounts: `admin@ksplatform.dev` (ADMIN) and `demo@ksplatform.dev` (USER)
- A post/tweet with at least one comment, authored by neither test account

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

## Manual smoke test

1. **Grant (User Story 1)**: As `admin@ksplatform.dev`, go to
   `/admin/permissions`, search for `demo@ksplatform.dev`, grant
   "Moderate comments." Confirm the grant appears immediately with your
   name and today's date.
2. **Narrow effect (User Story 1)**: Sign in as `demo@ksplatform.dev`, open
   the post/tweet with a comment. Confirm a delete control now appears on
   the comment. Confirm NO delete control appears on the post/tweet itself
   (that permission wasn't granted).
3. **Revoke (User Story 1, SC-002)**: As admin, revoke the "Moderate
   comments" grant. Reload the same page as `demo@ksplatform.dev` (no
   re-login) — confirm the comment delete control is gone.
4. **Audit view (User Story 2)**: As admin, grant two permissions to
   `demo@ksplatform.dev`, then view their permissions page — confirm both
   show with your name and grant date. View `admin@ksplatform.dev`'s own
   permissions page — confirm it shows all permissions attributed to their
   `ADMIN` role, not individual grants.
5. **Admin tabs by permission (User Story 3)**: Grant `demo@ksplatform.dev`
   only "Manage users." Sign in as them and visit `/admin` — confirm they
   can see and use the Users tab, but not the Posts or Tweets tabs.
6. **No regression for ADMIN**: Confirm `admin@ksplatform.dev` still sees
   and can use every tab and every moderation control everywhere, exactly
   as before this feature.

## Expected outcome

Every step above matches its described outcome. Any mismatch (a grant not
taking effect, a revoke leaving stale access, an ADMIN losing any existing
capability) is a defect against FR-003/FR-004/FR-007/SC-001/SC-002/SC-003.
