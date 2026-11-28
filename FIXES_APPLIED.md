# Resortify — local fixes

## Changes made
- Fixed the Lovable Vite config: standard Vite options now live under `vite`, where this config wrapper expects them.
- Pointed the `@` alias at the real `frontend/src` directory using a path relative to `vite.config.ts`.
- Pointed TanStack Start at `frontend/src` so it finds the router and route files.
- Corrected the root TypeScript include paths for the frontend source tree.
- Replaced the email verification, forgot-password, and reset-password API flows with clearly labelled Phase 2 information pages. The current backend contract explicitly says email delivery and these flows are not implemented.
- Kept the existing backend source and API configuration unchanged.

## Install and run on Windows

Open PowerShell in the **project root** (the folder containing the root `package.json`).

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:8080/`).

If you also want the API, open a second terminal:

```powershell
cd backend
npm install
npm run dev
```

The backend needs a valid `backend/.env` with your MongoDB connection string and JWT secret. The frontend needs the root `.env` with `VITE_API_BASE_URL=http://localhost:5000`.

## Environment files
For safety, this fixed archive does not include `.env` files or `node_modules`. Copy your existing root `.env` and `backend/.env` into the matching locations after extracting. Do not share those files publicly.

## Validation
The complete frontend TypeScript check passed (`tsc --noEmit`).
A production Vite build could not be run in this Linux workspace because the uploaded `node_modules` contained Windows-only native binaries. Install dependencies with `npm ci` on your Windows machine before running the app.
