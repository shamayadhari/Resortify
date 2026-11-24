# Resortify API

Express + MongoDB (Mongoose) backend for the Resortify interface. It implements every Phase 1 endpoint in
[`../docs/api-contract.md`](../docs/api-contract.md): sign-up, sign-in, profile, avatar upload and the contact
form. There is no email sending: accounts are active as soon as they are created.

## Run it

```bash
cd backend
npm install
cp .env.example .env     # then edit it (see below)
npm run dev              # http://localhost:5000/api/health
```

Then point the interface at it: in the project root, `cp .env.example .env` (it already says
`VITE_API_BASE_URL=http://localhost:5000`) and run `npm run dev` there.

### 1. Database

Pick one and put its address in `MONGODB_URI` inside `backend/.env`:

- **Local MongoDB** (needs Docker): from the project root run `docker compose up -d`, then use
  `MONGODB_URI=mongodb://127.0.0.1:27017/resortify`.
- **MongoDB Atlas**: create a free cluster, add a database user, and under *Network Access* allow your IP.
  Copy the `mongodb+srv://...` string, put your password in it and add `/resortify` before the `?`.

The API connects on start-up and exits with a plain message if it can't (the password is hidden in that log).
`GET /api/health` reports `{ ok, db }` and answers 503 while the database is down. Collections and indexes
(unique email) are created automatically.

### 2. Secrets

`JWT_SECRET` must be at least 32 random characters. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`backend/.env` is git-ignored. Never commit it, and never put real credentials in `.env.example`.

### 3. First admin (optional)

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Str0ngPass1' npm run seed
```

Creates or updates an admin. Admin screens arrive in a later phase.

## What it does

| Endpoint | Notes |
|---|---|
| `GET /api/health` | `{ ok, db }` |
| `POST /api/auth/register` | citizen only, email stored lowercase, 409 `EMAIL_TAKEN`, account is active immediately |
| `POST /api/auth/login` | `{ token, user }`; 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_SUSPENDED` |
| `GET /api/auth/me` | Bearer token |
| `PATCH /api/users/me` | name, phone, address |
| `POST /api/users/me/avatar` | multipart `avatar`, JPG/PNG/WebP up to 2 MB, saved as 320 px WebP |
| `PATCH /api/users/me/password` | 400 `WRONG_PASSWORD` |
| `POST /api/contact` | saved to the `contactmessages` collection |

Errors always look like `{ "error": { "code", "message", "details" } }`.

Security in place: bcrypt (cost 12), JWT (HS256, 7 days), same
response for unknown email vs wrong password, Helmet, JSON body limit, CORS allow-list, per-IP rate limits on the
sensitive routes, uploaded images re-encoded (not trusted by file type), suspended accounts blocked on every request.

## Configuration

See `.env.example`; every variable is documented there. Browser origins other than `CLIENT_URL` go in `CORS_ORIGINS`,
e.g. `https://my-app.lovable.app,https://*.lovableproject.com`.

## Tests

```bash
npm test
```

26 API tests (sign-up, sign-in, profile, avatar, password change, CORS, rate limit, suspended accounts). They use a separate
database named `resortify_test` on `mongodb://127.0.0.1:27017` (override with `TEST_MONGODB_URI`; the name must end in
`_test` or the tests refuse to run) and wipe it each run.

## Deploying

- Set the same variables on your host (Render, Railway, Fly...). Use `NODE_ENV=production`, a fresh `JWT_SECRET`,
  your Atlas URI, `CLIENT_URL` = your deployed interface, and `TRUST_PROXY=1` behind a platform proxy.
- Avatars are written to `UPLOAD_DIR` on local disk. Many hosts wipe the disk on each deploy, so mount a persistent
  volume there, or move uploads to cloud storage before going live (listed in the roadmap).
- Serve the API over HTTPS only.

## No email, so no password recovery

Because nothing is emailed, a forgotten password can't be reset by the user. Signed-in users can change it under
Profile. To recover an admin account run `npm run seed` again with a new `ADMIN_PASSWORD`. For anyone else, you would
set a new bcrypt hash in MongoDB by hand. Email addresses are also not checked, so anyone can sign up with any address.
