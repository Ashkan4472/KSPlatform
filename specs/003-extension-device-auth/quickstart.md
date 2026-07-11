# Quickstart: Validate Device-Flow Authentication

## Prerequisites

- Docker stack running: `docker compose up --build`
- Login: `demo@ksplatform.dev` / `password123`

## Type-check and lint gate

```bash
npx tsc --noEmit
npm run lint
```

Both MUST pass (part of the Verification Gate).

## Manual smoke test

Since the extension itself doesn't exist until specs/004 is implemented,
simulate it with `curl`:

1. **Request a code**:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/device/code | tee /tmp/device.json
   ```
   Expect `device_code`, `user_code`, `expires_in: 600`, `interval`.

2. **Poll before approval** (expect pending):
   ```bash
   DEVICE_CODE=$(jq -r .device_code /tmp/device.json)
   curl -s -X POST http://localhost:3000/api/v1/device/token \
     -H 'Content-Type: application/json' \
     -d "{\"device_code\":\"$DEVICE_CODE\"}"
   ```
   Expect `202` / `{"status":"authorization_pending"}`.

3. **Approve**: log into `http://localhost:3000` as `demo@ksplatform.dev`,
   visit `/connect`, enter the `user_code` from step 1, click Approve.

4. **Poll after approval** (expect a token):
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/device/token \
     -H 'Content-Type: application/json' \
     -d "{\"device_code\":\"$DEVICE_CODE\"}" | tee /tmp/token.json
   ```
   Expect `access_token`, `token_type: "Bearer"`.

5. **Use the token**:
   ```bash
   TOKEN=$(jq -r .access_token /tmp/token.json)
   curl -s http://localhost:3000/api/v1/feed \
     -H "Authorization: Bearer $TOKEN"
   ```
   (Feed endpoint itself is specs/004 — for this feature, confirm at least
   that an invalid/missing token on any `/api/v1/*` route returns `401`
   `reauthenticate_required`.)

6. **Revoke**: visit `/settings/connections`, revoke the "Browser Extension"
   entry, then repeat step 5 — expect `401` `reauthenticate_required`.

7. **Expiry**: request a fresh code, wait past `expires_in`, then poll —
   expect `400` `expired_token`.

## Expected outcome

Every step above returns the documented status/body. Any deviation
(wrong status code, token usable after revocation, expired code still
approvable) is a defect against FR-004/FR-006/SC-002.
