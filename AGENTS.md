<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Backend is the user's own Express + MongoDB API in `backend/` (run and deployed separately from the interface). Why: the user chose to keep MERN business logic outside Lovable.
- All API calls go through `src/services/api.ts` (Axios, base URL from `VITE_API_BASE_URL`); `docs/api-contract.md` is the contract and must be updated before adding endpoints. Why: one place for auth headers, error shape, and the server team's spec.
- Sessions are a JWT in localStorage sent as a Bearer header; `_authenticated` routes are `ssr: false` and gate on the token, then `/auth/me`. Why: cross-site cookies between Lovable and the API domain are unreliable.
- Every feature shown is real and backed by the API. If a future feature is not built yet, show it only as a labelled "coming soon" item, never as a clickable control, and never show sample data. Why: the brief forbids fake functionality. Estimates (prices, CO2) are labelled as estimates; the assistant is a built-in guide and says so.
