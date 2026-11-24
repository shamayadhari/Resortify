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
  { "error": { "code": "EMAIL_NOT_VERIFIED", "message": "Please verify your email first.", "details": {} } }
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
  "emailVerified": true,
  "status": "active",
  "partnerVerified": false,
  "createdAt": "2026-11-16T08:00:00.000Z",
  "updatedAt": "2026-11-16T08:00:00.000Z"
}
```

Never return `passwordHash` or token hashes.

Roles: `citizen | scrap_dealer | recycler | collection_partner | ngo | organization | admin`.
Status: `active | pending_verification | suspended`.

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
| POST | /auth/register | – | `{ name, email, password, role: "citizen" }` | 201 `{ message }`; sends verification email. 409 `EMAIL_TAKEN` if used. Reject any role other than `citizen` in Phase 1 (400). |
| POST | /auth/verify-email | – | `{ token }` | 200 `{ message }`; 400 `TOKEN_INVALID` / `TOKEN_EXPIRED` |
| POST | /auth/resend-verification | – | `{ email }` | 200 `{ message }` (always 200, don't reveal whether the account exists) |
| POST | /auth/login | – | `{ email, password }` | 200 `{ token, user }`; 401 `INVALID_CREDENTIALS`; 403 `EMAIL_NOT_VERIFIED`; 403 `ACCOUNT_SUSPENDED` |
| POST | /auth/forgot-password | – | `{ email }` | 200 `{ message }` (always 200) |
| POST | /auth/reset-password | – | `{ token, password }` | 200 `{ message }`; 400 `TOKEN_INVALID` / `TOKEN_EXPIRED` |
| GET | /auth/me | Bearer | – | 200 `{ user }` |
| PATCH | /users/me | Bearer | `{ name, phone, address: { line1, city, state, pincode } }` | 200 `{ user }` |
| POST | /users/me/avatar | Bearer | multipart `avatar` | 200 `{ user }`; 400 `INVALID_FILE`; 413 if too large |
| PATCH | /users/me/password | Bearer | `{ currentPassword, newPassword }` | 200 `{ message }`; 400 `WRONG_PASSWORD` |
| POST | /contact | – | `{ name, email, message }` | 201 `{ message }` |

Email links must point to the interface:

- `<APP_URL>/verify-email?token=<raw token>`
- `<APP_URL>/reset-password?token=<raw token>`

Store only a hash of each token, with an expiry (verification: 24 h, reset: 1 h), and make
them single-use.

## Suggested server hardening (Phase 1)

- bcrypt cost ≥ 10; JWT expiry e.g. 7 days; `JWT_SECRET` from env.
- Rate-limit `/auth/*` and `/contact` (e.g. 10 requests / 15 min / IP).
- Helmet, request body size limit, Multer file-type + size checks.
- Centralised error handler producing the error shape above.
