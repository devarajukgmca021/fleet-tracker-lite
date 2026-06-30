# Fleet Tracker Lite

A full-stack fleet management web application for transport companies to manage trucks, drivers, and trips with live GPS simulation on an interactive map.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/fleet-tracker run dev` — run the frontend (port 18870, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, Recharts, react-leaflet + OpenStreetMap
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OIDC)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (trucks, drivers, trips, alerts, auth)
- `artifacts/api-server/src/routes/` — Express route handlers (trucks, drivers, trips, tracking, alerts, dashboard)
- `artifacts/fleet-tracker/src/` — React frontend (pages: dashboard, trucks, drivers, trips, tracking, alerts)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not edit manually)

## Architecture decisions

- OpenAPI-first: all API contracts defined in `lib/api-spec/openapi.yaml` before implementation
- GPS simulation via POST `/api/trips/:id/locations` — no physical hardware needed; client can send coordinates
- Live tracking polls `GET /api/tracking/live` every 5 seconds using TanStack Query's `refetchInterval`
- Replit Auth (OIDC) handles authentication — no custom login forms
- Alert system auto-creates alerts when trips start/complete via server-side logic

## Product

- **Dashboard**: Fleet KPIs, monthly trip charts, truck utilization breakdown
- **Truck Management**: Add, edit, delete trucks with status tracking (available/assigned/running/maintenance)
- **Driver Management**: Add, edit, delete drivers with availability tracking
- **Trip Management**: Create trips, assign trucks/drivers, start and complete trips with one click
- **Live Tracking**: Interactive Leaflet map showing real-time truck positions with auto-polling
- **Alerts Panel**: System alerts (trip started, completed, overspeed, offline) with mark-as-read

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec
- Run `pnpm --filter @workspace/db run push` after changing schema files in `lib/db/src/schema/`
- The API server rebuilds on dev start — route changes require a workflow restart
- Leaflet requires its CSS to be imported in `index.css` for map tiles to render correctly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
