# Resortify API contract

The Resortify interface (this project) talks to a separately hosted Express + MongoDB API.
This file is the source of truth for what that API must implement. Each phase adds its
endpoints here before the interface work starts.

## Conventions

- Base URL: `VITE_API_BASE_URL` + `/api`, e.g. `https://api.example.com/api`.
- JSON in and out, except file uploads (`multipart/form-data`).
- Auth: `Authorization: Bearer <JWT>` header. No cookies.
- CORS: allow the Lovable preview and published origins, methods `GET,POST,PATCH,PUT,DELETE,OPTIONS`,
  headers `Authorization, Content-Type`.
- Errors: proper HTTP status + body
  ```json
  { "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect.", "details": {} } }
  ```
  `message` is shown to users as-is, so write it for people.
- A `401` on a request that carried a token signs the user out in the interface.
- Uploaded files are returned as absolute URLs or paths like `/uploads/abc.webp`
  (paths are resolved against the API base URL).

## User object

```json
{
  "_id": "665f...",
  "name": "Asha Verma",
  "email": "asha@example.com",
  "role": "citizen",
  "phone": "9876543210",
  "address": { "line1": "12 MG Road", "city": "Pune", "state": "Maharashtra", "pincode": "411001" },
  "avatarUrl": "/uploads/avatars/665f.webp",
  "status": "active",
  "partnerVerified": false,
  "createdAt": "2026-11-16T08:00:00.000Z",
  "updatedAt": "2026-11-16T08:00:00.000Z"
}
```

Never return `passwordHash` or token hashes.

Roles: `citizen | scrap_dealer | recycler | collection_partner | ngo | organization | admin`.
Status: `active | suspended`.

## Validation rules (mirror these on the server)

- Password: 8–128 chars, at least one letter and one number.
- Email: valid, stored lowercase, unique.
- Name: 2–80 chars.
- Phone (optional): Indian mobile, optional `+91`, 10 digits starting 6–9.
- PIN code (optional): 6 digits, first digit 1–9.
- Avatar: `image/jpeg | image/png | image/webp`, max 2 MB, field name `avatar`.

## Phase 1 endpoints

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | /health | – | – | 200 `{ "ok": true }` |
| POST | /auth/register | – | `{ name, email, password, role: "citizen" }` | 201 `{ message }`; the account is active immediately (no email is sent). 409 `EMAIL_TAKEN` if used. Reject any role other than `citizen` in Phase 1 (400). |
| POST | /auth/login | – | `{ email, password }` | 200 `{ token, user }`; 401 `INVALID_CREDENTIALS`; 403 `ACCOUNT_SUSPENDED` |
| GET | /auth/me | Bearer | – | 200 `{ user }` |
| PATCH | /users/me | Bearer | `{ name, phone, address: { line1, city, state, pincode } }` | 200 `{ user }` |
| POST | /users/me/avatar | Bearer | multipart `avatar` | 200 `{ user }`; 400 `INVALID_FILE`; 413 if too large |
| PATCH | /users/me/password | Bearer | `{ currentPassword, newPassword }` | 200 `{ message }`; 400 `WRONG_PASSWORD` |
| POST | /contact | – | `{ name, email, message }` | 201 `{ message }` |

## Suggested server hardening (Phase 1)

- bcrypt cost ≥ 10; JWT expiry e.g. 7 days; `JWT_SECRET` from env.
- Rate-limit `/auth/*` and `/contact` (e.g. 10 requests / 15 min / IP).
- Helmet, request body size limit, Multer file-type + size checks.
- Centralised error handler producing the error shape above.

## Implemented in `backend/` (additions to the contract)

- There is **no email**: no verification, no resend, no forgot or reset password. Accounts are active on sign-up and the interface signs the person in right after `POST /auth/register`.
- `GET /health` also returns `db` (`connected` | `disconnected` | ...) and answers `503 { ok: false }` while MongoDB is unreachable.
- Extra error codes: `VALIDATION_ERROR` (400, `details.fieldErrors`), `ROLE_NOT_ALLOWED` (400), `UNAUTHENTICATED` / `INVALID_TOKEN` (401), `FILE_TOO_LARGE` (413), `RATE_LIMITED` (429), `CORS_NOT_ALLOWED` (403), `NOT_FOUND` (404), `INTERNAL_ERROR` (500).
- Phone numbers are stored as 10 digits (a leading `+91` is removed). Avatars are re-encoded to 320x320 WebP.
- Rate limit (10 / 15 min / IP by default) applies to `/auth/register`, `/auth/login` and `/contact`, not to `/auth/me`.


---

# Phases 2-7 (implemented in `backend/`)

Base path `/api`. `Bearer` = `Authorization: Bearer <token>`. Lists are paged: `?page=1&limit=20` (max 50) and return `{ items, page, limit, total, pages }`. Ids that aren't valid ObjectIds return 404. Partner roles (`scrap_dealer`, `recycler`, `collection_partner`, `ngo`) get 403 `PARTNER_NOT_VERIFIED` on actions until an admin verifies them.

**Registration** now accepts `role` = any of `citizen`, `scrap_dealer`, `recycler`, `collection_partner`, `ngo`, `organization`. `admin` is only created by `npm run seed` (400 `ROLE_NOT_ALLOWED`).

## Phase 2: items
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /catalog | public | categories (key, label, typical weight, hazardous, materials) and conditions. Cached 1 h. |
| POST | /classify | any | `{ title, description }` returns `{ classification: { category, confidence, matched, alternatives, source: "keyword-rules" } }` |
| POST | /items | citizen, organization | multipart: `title, condition, weightKg, ageYears?, description?, category?`, up to 4 `images` (JPG/PNG/WebP, 5 MB). Category defaults to the suggestion. Returns the item with `recommendations` and a `trackingCode`. |
| GET | /items | citizen, organization | my items; filters `status, category, q` |
| GET | /items/:id | owner or admin | `{ item, events }` (item includes `recommendations`) |
| PATCH | /items/:id | owner | only while `status = reported` (else 409 `ITEM_LOCKED`) |
| POST | /items/:id/images | owner | add photos (max 4 total) |
| DELETE | /items/:id | owner | only while `reported` |

Item statuses: `reported, pickup_requested, collected, delivered, processed, listed, donation_pending, sold, donated, cancelled`.

## Phase 3: facilities and pickups
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /facilities | public | `lat, lng, radiusKm` (nearest first, adds `distanceKm`) or `city`; filters `type, category, verified=true` |
| GET/POST | /facilities/mine, /facilities | partner roles, admin | create is limited by role (recycler: recycler/collection_point, etc.). New or moved places are unverified. |
| PUT/DELETE | /facilities/:id | owner, admin | |
| POST | /admin/facilities/:id/verify | admin | `{ verified }` |
| POST | /pickups | citizen, organization | `{ items[], description?, address, preferredDate, slot, frequency: once|daily|weekly|monthly, estimatedWeightKg?, notes? }` |
| GET | /pickups | any | citizens: mine. Collectors: `?scope=open` (their city) or `mine`. Others: deliveries to their facilities. |
| GET | /pickups/:id | requester, assigned collector, admin, verified collector (open ones in their city) | includes `history` |
| POST | /pickups/:id/accept | verified collector | atomic; 409 `PICKUP_UNAVAILABLE` if taken |
| POST | /pickups/:id/status | assigned collector | `{ status: on_the_way | collected | delivered | cancelled, verifiedWeightKg (required for collected), payoutInr?, facilityId (required for delivered), note? }`. Allowed moves: requested>accepted>on_the_way>collected>delivered; 409 `INVALID_TRANSITION` otherwise. A delivered recurring pickup creates the next one. |
| POST | /pickups/:id/cancel | requester | only before collection |

## Phase 4: marketplace, price, recycler
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /marketplace | any | filters `q, category, condition, city, minPrice, maxPrice, sort=new|price_asc|price_desc, mine=true` |
| POST | /marketplace | citizen, organization, dealer, recycler (verified) | `{ itemId?, title, description?, category, condition, weightKg, price }`; stores a fair `reference` range |
| GET/PATCH/DELETE | /marketplace/:id | | GET also returns `myOffer` |
| POST | /marketplace/:id/offers | non-admin, verified | `{ price, message? }`; one pending offer per bidder (re-sending updates it); `fairness`: below / fair / above |
| GET | /marketplace/:id/offers | seller | |
| POST | /offers/:id/respond | seller | `{ accept }`; accepting reserves the listing and rejects other offers |
| POST | /marketplace/:id/complete | seller | reserved to sold |
| GET | /marketplace/offers/mine | any | |
| GET | /prices/estimate | any | `category, condition, weightKg, ageYears, city?` returns resale and scrap ranges plus `basis` |
| GET | /prices/market | any | default and local-average rate per category (average shown when 2+ dealers publish) |
| GET/PUT | /prices/rates/mine, /prices/rates | dealer, recycler | `{ rates: [{ category, ratePerKg }] }` |
| GET | /recycler/items | verified recycler | `?stage=incoming|received|processed` |
| POST | /recycler/items/:id/receive | verified recycler | `{ receivedWeightKg }`; returns `weightMismatch` if >20% off the collector's weight |
| POST | /recycler/items/:id/process | verified recycler | `{ recoveredMaterials: [{ material, kg }] }`; issues `RSF-CERT-...`; total can't exceed intake weight |

## Phase 5: tracking, donations, drives
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /track/:code | public | item journey and certificate. Never includes owner name, address, phone or email. |
| GET | /ngos, /needs | any | verified NGOs; open needs (`city, category, mine=true`) |
| POST | /needs, /needs/:id/close | verified NGO | |
| POST | /donations | citizen, organization | `{ itemId, ngoId, needId?, message? }`; working/repairable items only (400 `NOT_DONATABLE`) |
| GET | /donations | any | donor: mine; NGO: incoming |
| POST | /donations/:id/respond, /receive | verified NGO | `{ accept }`; receive marks the item donated |
| POST | /donations/:id/cancel | donor | |
| POST | /drives | organization | `{ title, date, address, expectedWeightKg?, categories? }` |
| GET | /drives | organization (own), collector/recycler (`open` in city or `?scope=mine`), admin | |
| POST | /drives/:id/claim, /complete | verified collector or recycler | complete: `{ actualWeightKg, itemCount? }` issues `RSF-DRV-...` |
| POST | /drives/:id/cancel | organization | |
| GET | /drives/:id/report | organization, claimer, admin | completed drives only |

## Phase 6: rewards, community, assistant, analytics
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /rewards/me | any | `{ points, level, badges, rules, ledger (paged), redemptions }` |
| GET | /rewards/catalog, /rewards/leaderboard | any | leaderboard shows first name + initial only |
| POST | /rewards/redeem | any | `{ rewardId }`; atomic (no overspend, stock honoured). 400 `NOT_ENOUGH_POINTS`, 409 `OUT_OF_STOCK` |
| POST/PUT | /rewards, /rewards/:id | admin | |
| GET/POST | /community/posts | any | filter `kind`; max 10 posts a day, points for the first 3 |
| POST | /community/posts/:id/like (toggle), /report | any | |
| GET/POST | /community/posts/:id/comments | any | |
| DELETE | /community/posts/:id, /community/comments/:id | author or admin | |
| POST | /assistant/ask | any | `{ message }` returns `{ found, answer, sources, actions, related, itemHint }`. Built-in guide, not an AI model. |
| GET | /analytics/me | any | totals, by status/category, last 6 months. CO2 is an estimate. |
| GET | /analytics/platform | admin | users by role, items, funnel, top recyclers |
| GET | /dashboard/summary | any | small role-specific counts |

Points are awarded once per real event (idempotent key): item reported 5 (+25 first item), pickup delivered 20, recycled 4/kg (max 100/item), donation received 30, item sold 15, post 2 (first 3 a day).

## Admin
`GET /admin/users` (`role, status, pending=true, q`), `PATCH /admin/users/:id` (`status`, `partnerVerified`), `GET /admin/facilities`, `GET /admin/contact`, `POST /admin/contact/:id/handled`, `GET /admin/posts/reported`, `POST /admin/posts/:id/status`, `GET /admin/audit`. Verification, suspension, post moderation and reward changes are written to the audit log.

## Phase 7 notes
- `GET /health` is readiness (needs MongoDB, 503 otherwise); `GET /health/live` only says the process is up.
- Every response carries `X-Request-Id`. One JSON log line per request (no bodies, no tokens).
- Request bodies and queries containing `$` or `.` keys are rejected (400 `INVALID_INPUT`). API-wide limit 300 requests/min/IP (`API_RATE_LIMIT`), 30 writes/min/user, tighter limits on sign-in/sign-up and the assistant.
