# Feature Specification: Browser Extension Device-Flow Authentication

**Feature Branch**: `003-extension-device-auth`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Foundational auth feature for the new
daily.dev-style browser extension (specs/004): the extension cannot use
KSPlatform's existing cookie-based Auth.js session (different origin, no
REST mutation surface). Build an OAuth-style device flow so the extension
gets a revocable access token without ever handling the user's password,
per Constitution Principle VII (External-Client API Is a Deliberate, Scoped
Exception)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect the extension without typing a password into it (Priority: P1)

As a KSPlatform user installing the browser extension, I want to approve the
extension's access from a page I already trust (the KSPlatform web app I'm
logged into), so the extension never sees or stores my email/password.

**Why this priority**: This is the entire security model of the feature — an
extension that instead asked for email/password directly would defeat the
purpose and violate Principle VII's requirement that credentials aren't
exposed to a new trust boundary.

**Independent Test**: Install the extension, trigger "Connect account," see
a short code, enter/confirm it on the KSPlatform web app while logged in,
and observe the extension become connected within a few seconds — without
ever being prompted for a password inside the extension UI.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor opens the extension's "Connect account"
   flow, **When** they follow the link to the verification page, **Then**
   they are prompted to log into KSPlatform first (existing login flow),
   then asked to approve the extension.
2. **Given** a signed-in user opens the verification page with the code
   pre-filled (via a link the extension provides), **When** they click
   "Approve," **Then** the extension detects the approval and becomes
   connected without further user action.
3. **Given** a user declines/closes the verification page without approving,
   **When** the code's validity window elapses, **Then** the extension shows
   "Connection request expired, try again" and the code cannot be approved
   afterward.

---

### User Story 2 - Revoke extension access at any time (Priority: P2)

As a KSPlatform user, I want to see which extensions/devices are connected
to my account and revoke any of them, so a lost laptop or an extension I no
longer use can't keep reading my feed.

**Why this priority**: Required by Constitution Principle VII
("independently revocable... without contacting support") — without this,
User Story 1 alone would ship a token the user can never take back.

**Independent Test**: Connect the extension, then from the web app's account
settings revoke it, and confirm the extension's next API call fails with an
auth error prompting reconnection.

**Acceptance Scenarios**:

1. **Given** a user has one or more connected extensions listed in account
   settings, **When** they click "Revoke" on one, **Then** that token
   immediately stops working for all future requests.
2. **Given** a revoked token, **When** the extension makes its next feed
   request, **Then** it receives an unambiguous "reconnect" error (not a
   generic failure) so the extension can prompt the user to reconnect.

### Edge Cases

- What happens if the user approves the same code twice (e.g. two browser
  tabs)? The second approval attempt MUST be a no-op / clear "already
  approved" message, not a duplicate token.
- What happens if the extension polls after the code has expired? MUST
  receive a distinct "expired" response so the extension can restart the
  flow rather than polling forever.
- What happens if a user has multiple browsers/machines each running the
  extension? Each MUST get its own independently-named, independently-
  revocable connection — approving one must not invalidate another.
- What happens to a device code that was never displayed to a real user
  (abuse: a script hammering the code-issuance endpoint)? Issuance MUST be
  rate-limited per IP/session to prevent enumeration or resource exhaustion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let an unauthenticated extension request a
  short-lived, human-readable connection code without providing any
  credentials.
- **FR-002**: The system MUST let a signed-in user approve a pending
  connection code from the KSPlatform web app, binding it to their account.
- **FR-003**: Once approved, the system MUST issue the extension a
  long-lived access credential without ever transmitting the user's
  password to the extension.
- **FR-004**: Connection codes MUST expire after a short, fixed window
  (target: 10 minutes) if not approved.
- **FR-005**: The system MUST let a signed-in user view all of their active
  extension connections (with a human-readable label and last-used time) and
  revoke any of them individually.
- **FR-006**: A revoked or expired credential MUST be rejected by every
  subsequent API request with a distinct, machine-readable "reauthenticate"
  signal (not the same error as an unrelated failure).
- **FR-007**: Code issuance and approval-polling MUST be rate-limited to
  prevent enumeration/abuse of connection codes.
- **FR-008**: The credential issued to the extension MUST be usable only
  against the external-client API surface (Constitution Principle VII) —
  it MUST NOT grant access to web-app session-only actions.

### Key Entities

- **Device Connection Request**: A short-lived, human-readable code
  representing one pending "please let this extension access my account"
  request; has a status (pending, approved, expired, denied) and an
  expiration.
- **Extension Connection**: A named, revocable, long-lived credential
  representing one approved extension installation's access to one user's
  account; tracks when it was created and last used.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from installing the extension to seeing their
  feed in under 60 seconds, with zero password entry inside the extension.
- **SC-002**: 100% of revoked or expired connections are rejected on their
  very next API call — no stale grace period.
- **SC-003**: A user can view and revoke any connected extension from the
  web app in 2 clicks or fewer from account settings.
- **SC-004**: Code issuance/polling endpoints reject abusive request rates
  (specific threshold defined in the implementation plan) without degrading
  normal single-user connection flows.

## Assumptions

- This feature only covers the authentication/authorization plumbing; the
  actual data the extension fetches (the subscribed-tags feed) is specified
  separately in specs/004-extension-newtab-feed, which depends on this one.
- "Long-lived" credential means the user doesn't have to reconnect
  regularly under normal use, but the credential remains individually
  revocable at any time per FR-005/FR-006 — this spec does not mandate a
  specific lifetime, that's an implementation-plan detail.
- The verification/approval UI is a new page in the existing KSPlatform web
  app (reuses its existing login), not a new standalone service.
