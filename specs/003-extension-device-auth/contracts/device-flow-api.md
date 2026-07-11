# Contract: Device Flow API (`/api/v1/device/*`)

All endpoints are under the versioned external-client surface (Constitution
Principle VII). None require the Auth.js session cookie; the token endpoint
is the only one that becomes usable once a session-authenticated approval
has occurred (via the server action, not this API).

## POST /api/v1/device/code

Request (no auth, no body required):

```json
{}
```

Response `200`:

```json
{
  "device_code": "a1b2c3...(high entropy)",
  "user_code": "WXYZ-1234",
  "verification_uri": "https://ksplatform.dev/connect",
  "verification_uri_complete": "https://ksplatform.dev/connect?code=WXYZ-1234",
  "expires_in": 600,
  "interval": 5
}
```

Response `429` (FR-007 rate limit):

```json
{ "error": "rate_limited", "retry_after": 30 }
```

## POST /api/v1/device/token

Request:

```json
{ "device_code": "a1b2c3..." }
```

Response `200` (approved):

```json
{
  "access_token": "raw-bearer-token-shown-once",
  "token_type": "Bearer",
  "label": "Browser Extension — Chrome"
}
```

Response `202` (still pending — extension keeps polling at `interval`):

```json
{ "status": "authorization_pending" }
```

Response `400` (expired or denied — extension MUST restart the flow, not
keep polling):

```json
{ "error": "expired_token" }
```

or

```json
{ "error": "access_denied" }
```

## Bearer-token-authenticated requests (any `/api/v1/*` endpoint, e.g. specs/004's feed)

Request header: `Authorization: Bearer <access_token>`

Response `401` when the token is invalid/revoked/expired (FR-006 — the
distinct "reauthenticate" signal):

```json
{ "error": "reauthenticate_required" }
```

## Web-app server actions (session-authenticated, not part of this API)

These are `"use server"` functions per Constitution Principle II, invoked
from `/connect` and `/settings/connections` — not REST endpoints:

- `approveDeviceCodeAction(userCode: string): Promise<ActionResult>` — binds
  the current session user to the matching `PENDING` `DeviceGrant`, creates
  its `ExtensionToken`, marks the grant `APPROVED`.
- `listExtensionConnectionsAction(): Promise<{ id: string; label: string; createdAt: Date; lastUsedAt: Date | null }[]>`
- `revokeExtensionConnectionAction(tokenId: string): Promise<ActionResult>`
  — ownership-checked (only the owning user may revoke their own token).
