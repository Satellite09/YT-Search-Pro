# YT Search Pro

A Chrome extension for precise, subscription-scoped YouTube retrieval with local indexing, date windows, and creator-country filters.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/yt-search-pro run dev` — run the extension UI preview
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/yt-search-pro/src/lib/` — IndexedDB, local search, and YouTube indexing engine
- `artifacts/yt-search-pro/public/manifest.json` — Manifest V3 extension metadata
- `artifacts/yt-search-pro/public/service-worker.js` — scheduled refresh and Chrome identity bridge

## Architecture decisions

- Subscription search never uses `search.list`; it enumerates subscriptions and uploads playlists.
- The 12-month video corpus and near-static country metadata live locally in IndexedDB.
- Index builds checkpoint after each channel and expose partial results while continuing.
- Global search is isolated as a quota-metered mode.
- Brave authentication uses a server-side OAuth authorization-code exchange; the API returns the access token in the intercepted `chromiumapp.org` URL fragment, never exposing the Web client secret.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
