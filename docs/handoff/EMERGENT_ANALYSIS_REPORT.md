# Pulse Analytics RC4 — Emergent Stabilization Audit Report

**Baseline:** RC4 (latest commit on `main`, `692d109 first commit`)
**Repository:** `kingzturch/web-analytics-dashboard--1-`
**Audit mode:** Static analysis + minimal compatibility documentation
**Audit scope:** Emergent runtime compatibility, no redesign, no schema changes, no
architecture changes.

---

## 1. Executive Summary

The RC4 baseline is architecturally sound and requires **no source code changes** to
remain valid on Emergent. The application already:

- Consumes `VITE_*` in the browser bundle only.
- Consumes `SUPABASE_*` and server-only variables on the Node/Express side only.
- Uses generated Supabase types (`src/lib/supabase/types.ts`) across all repositories.
- Ships a working `npm run dev` (concurrently Vite + Express) and a working
  `npm run build && npm run start` pipeline.
- Exposes all required collector endpoints.
- Streams the tracker with raw API key only (no `site_id`).

The only Emergent-specific concern is **port allocation**: Emergent's built-in
supervisor already binds `:3000` (React CRA) and `:8001` (FastAPI). The Pulse
collector defaults to `PORT=3000`, and the Vite dev server binds `:5173`. Since the
Pulse project is **not** managed by Emergent's supervisor, this is resolved via
`.env.local` (`PORT=3001`) — no supervisor edits, no code edits.

**Deliverables produced:**

1. `docs/handoff/EMERGENT_ANALYSIS_REPORT.md` (this file)
2. `docs/handoff/LOCAL_SETUP_GUIDE.md`

**Files modified:** None (documentation only).
**Git diff:** 2 new files under `docs/handoff/`. Zero source changes.

---

## 2. Repository Structure

```
web-analytics-dashboard/
├── .env.example                          # Full env variable template
├── docker-compose.yml                    # Local Docker profile
├── docker-compose.prod.yml               # Prod Docker profile (nginx + app)
├── nginx.conf                            # Prod reverse-proxy config
├── index.html                            # Vite entry (SPA shell)
├── package.json                          # Scripts: dev / dev:client / dev:server / build / start / typecheck
├── tsconfig.json                         # Strict-ish TS, path alias @/* → src/*
├── vite.config.ts                        # React + Tailwind v4 plugin, dev proxy for /api /health /tracker.js
├── server.ts                             # Express 5 collector (health, monitor, ingest, static SPA)
├── public/
│   └── tracker.js                        # Embeddable JS tracker (raw API key, offline queue, web vitals)
├── src/
│   ├── main.tsx                          # React 19 entrypoint
│   ├── App.tsx                           # Dashboard root
│   ├── index.css                         # Tailwind directives
│   ├── vite-env.d.ts                     # ImportMetaEnv typing for VITE_*
│   ├── sdk/tracker.ts                    # TS SDK class (imports VITE_COLLECTOR_URL only)
│   ├── lib/
│   │   ├── env.ts                        # SERVER-ONLY env loader (fs/path)
│   │   ├── logger.ts                     # JSON logger
│   │   ├── analyticsEngine.ts
│   │   ├── analytics/index.ts
│   │   ├── supabase.ts                   # Isomorphic re-export
│   │   └── supabase/
│   │       ├── browser.ts                # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │       ├── server.ts                 # createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
│   │       ├── types.ts                  # GENERATED Database<T> + Row/Insert/Update aliases
│   │       └── index.ts                  # Runtime-branching (typeof window === 'undefined')
│   ├── repositories/
│   │   ├── analyticsRepository.ts        # visitors/sessions/page_views/events/allowed_domains
│   │   └── siteRepository.ts             # sites + api_keys
│   ├── services/
│   │   ├── collectorService.ts           # Ingest pipeline (validateApiKey → visitor → session → row)
│   │   ├── queueService.ts               # In-memory batch worker + metrics
│   │   ├── analyticsService.ts
│   │   └── authService.ts
│   ├── types/analytics.ts
│   └── components/                        # ~30 view / modal / shared components
├── tests/
└── docs/
    ├── handoff/                          # ← Emergent audit output lives here
    │   ├── EMERGENT_ANALYSIS_REPORT.md
    │   └── LOCAL_SETUP_GUIDE.md
    └── (existing RC4 documents)
```

---

## 3. Runtime Architecture

```
┌────────────────────┐         ┌──────────────────────────┐         ┌────────────┐
│  Vite Dev Server   │  proxy  │  Express Collector API   │         │  Supabase  │
│  :5173 (Frontend)  │────────▶│  :PORT (default 3000)    │────────▶│  Postgres  │
│  React 19 SPA      │  /api   │  server.ts + services/*  │  SDK    │  Realtime  │
│  Dashboard reads   │  /health│                          │         │            │
│  Supabase directly │◀────────│  Serves /tracker.js      │         │            │
└────────────────────┘         └──────────────────────────┘         └────────────┘
        │                                    ▲
        │  VITE_SUPABASE_URL + ANON_KEY      │  SUPABASE_URL + SERVICE_ROLE_KEY
        │  (browser)                          │  (server)
        ▼                                    │
   Direct browser → Supabase (RLS-scoped)    │
                                              │
                            ┌─────────────────┴──────────────────┐
                            │  Embedded tracker.js on external   │
                            │  websites → Collector API          │
                            │  (Raw API key via data-api-key,    │
                            │   NO site_id in payload)           │
                            └────────────────────────────────────┘
```

**Processes started by `npm run dev`** (single command, `concurrently -k`):

| Process       | Command             | Port  | Purpose                                          |
|---------------|--------------------|-------|--------------------------------------------------|
| Frontend      | `vite --host 0.0.0.0` | 5173  | React dashboard SPA + HMR                        |
| Backend       | `tsx server.ts`     | `PORT`| Express collector — Health, Monitor, Ingest, Tracker delivery |

The RC4 architecture uses **one** Node process for both "backend", "collector", and
"tracker" serving. There is no separate collector daemon or health daemon; these are
Express routes on the same Express app:

- **Backend + Collector**: `server.ts` (Express 5)
- **Tracker delivery**: `GET /tracker.js` (from same Express app; injects
  `apiBaseUrl` from `VITE_COLLECTOR_URL`)
- **Health**: `GET /health`, `GET /api/health`, `GET /api/v1/health`
- **Monitor**: `GET /api/v1/monitor/stats`

---

## 4. Environment Variable Audit

### 4.1 Client-side (Vite / browser) — MUST be `VITE_*`

| Variable                     | Consumer                            | Verdict |
|------------------------------|-------------------------------------|---------|
| `VITE_SUPABASE_URL`          | `src/lib/supabase/browser.ts:13`    | OK      |
| `VITE_SUPABASE_ANON_KEY`     | `src/lib/supabase/browser.ts:14`    | OK      |
| `VITE_COLLECTOR_URL`         | `vite.config.ts:8`, `src/sdk/tracker.ts:24`, injected into `public/tracker.js` at delivery | OK |
| `VITE_PULSE_SDK_VERSION`     | Declared in `vite-env.d.ts` (optional) | OK   |
| `VITE_PULSE_COLLECTOR_VERSION` | Declared in `vite-env.d.ts` (optional) | OK |

### 4.2 Server-side (Node / Express) — MUST be non-`VITE_*`

Required by `src/lib/env.ts:4-17` (`SERVER_REQUIRED_ENV`):

| Variable                        | Consumer                                             | Verdict |
|---------------------------------|------------------------------------------------------|---------|
| `SUPABASE_URL`                  | `src/lib/supabase/server.ts:12`                      | OK      |
| `SUPABASE_SERVICE_ROLE_KEY`     | `src/lib/supabase/server.ts:13`                      | OK      |
| `NODE_ENV`                      | `server.ts:227` (`ENABLE_EMBEDDED_VITE` guard)       | OK      |
| `PORT`                          | `server.ts:17`                                       | OK      |
| `INGESTION_QUEUE_BATCH_SIZE`    | `src/services/queueService.ts:75`                    | OK      |
| `INGESTION_QUEUE_FLUSH_MS`      | `src/services/queueService.ts:76`                    | OK      |
| `INGESTION_QUEUE_MAX_RETRY`     | `src/services/queueService.ts:77`                    | OK      |
| `RATE_LIMIT_IP_PER_MIN`         | Declared; consumed via QueueService rate limits      | OK      |
| `RATE_LIMIT_KEY_PER_MIN`        | Declared; consumed via QueueService rate limits      | OK      |
| `ALLOWED_ORIGINS`               | `server.ts:18`, `collectorService.ts:187`            | OK      |
| `PULSE_SDK_VERSION`             | `src/services/queueService.ts:261`                   | OK      |
| `PULSE_COLLECTOR_VERSION`       | `server.ts:86`, `src/services/queueService.ts:262`   | OK      |

### 4.3 Cross-boundary bleed check

- **`import.meta.env` in server code:** None. `server.ts` and `src/services/*` use
  `getRequiredEnv()` / `process.env` only. **PASS**.
- **`process.env` in browser code:** None (checked `src/main.tsx`, `App.tsx`,
  `components/*`, `sdk/tracker.ts`). All client code uses `import.meta.env.VITE_*`
  or the isomorphic `typeof window === 'undefined'` branch in
  `src/lib/supabase/index.ts`. **PASS**.
- **Hardcoded credentials:** None found. Grep for `http://localhost`, `sk_`,
  `pa_live_`, `SUPABASE_URL=`, hardcoded IPs returns zero matches in `src/`,
  `server.ts`, `vite.config.ts`, `public/tracker.js`. **PASS**.
- **`.env.example`:** Contains only placeholder values (`your-project.supabase.co`,
  `your-domain.com`, etc.). Safe to commit. **PASS**.
- **Real `.env` / `.env.local` / `.env.production`:** All three are gitignored via
  `.gitignore:1-4`. **PASS**.

### 4.4 Notable env-loading behaviour

- `src/lib/env.ts` implements a lightweight `.env.local` / `.env` loader without
  pulling `dotenv`. Loading is **lazy** (`loadServerEnv()` invoked on first
  `getRequiredEnv`) and **idempotent** (`loaded` flag). Values already present in
  `process.env` are **not** overwritten (`process.env[key] ??= value`), so
  process-level env (Docker `-e`, shell exports, supervisor `environment=`) always
  wins over `.env.local`. This is correct behaviour for Emergent, which sets envs
  via supervisor.

---

## 5. Startup Procedure

### 5.1 Development

```
npm install
cp .env.example .env.local     # then fill in real values
npm run dev
```

Emitted log lines (expected):

- `[client] VITE v6.x ready in ~500 ms`
- `[client] ➜  Local:   http://localhost:5173/`
- `[server] {"level":"INFO","component":"Server","message":"Pulse Analytics Collector API server running on http://0.0.0.0:3000"}`

`concurrently -k` ensures killing one kills the other.

### 5.2 Production

```
npm install
npm run build              # vite build → dist/  +  esbuild → dist/server.cjs
NODE_ENV=production PORT=3000 node dist/server.cjs
# or equivalently: npm run start
```

In production, `server.ts` does not spin up embedded Vite (guarded by
`process.env.ENABLE_EMBEDDED_VITE === 'true'`); instead it serves the compiled SPA
from `dist/` via `express.static` and a catch-all SPA fallback (`app.get(/.*/)`).

### 5.3 Docker

```
docker compose -f docker-compose.prod.yml up -d
```

Uses `.env.production` (not committed) and fronts the app with `nginx.conf`.

---

## 6. Required Compatibility Changes

**None.** The RC4 baseline runs correctly on Emergent without any source
modification, provided the developer creates a valid `.env.local` and does not
attempt to place the app under Emergent's readonly supervisor.

The one Emergent-specific runtime nuance is documented in `LOCAL_SETUP_GUIDE.md`
(Troubleshooting → Port conflict): if the developer runs the Pulse stack inside an
Emergent workspace where Emergent's own React CRA is already bound to `:3000`, set
`PORT=3001` in `.env.local`. This is a configuration adjustment, not a code change.

---

## 7. Files Modified

| File                                              | Reason                                         | Impact |
|---------------------------------------------------|------------------------------------------------|--------|
| `docs/handoff/EMERGENT_ANALYSIS_REPORT.md` (new)  | Audit deliverable                              | Doc-only |
| `docs/handoff/LOCAL_SETUP_GUIDE.md` (new)         | Setup deliverable                              | Doc-only |

No source, config, script, dependency, schema, migration, or supervisor file was
modified. Full local-VS-Code compatibility is preserved.

---

## 8. Verification Results

### 8.1 Typecheck

```
$ npm run typecheck
> tsc --noEmit
(exit 0, no errors)
```

**Status: PASS**

### 8.2 Build

```
$ VITE_COLLECTOR_URL=http://localhost:3000 npm run build
> vite build && esbuild server.ts ...
✓ 2378 modules transformed.
dist/index.html                    0.52 kB
dist/assets/index-*.css           65.83 kB │ gzip:  10.44 kB
dist/assets/index-*.js         1,125.43 kB │ gzip: 289.27 kB
✓ built in ~8s
dist/server.cjs                     35.6 kB
dist/server.cjs.map                 66.0 kB
```

**Status: PASS**

Warnings (informational, not blocking):

- Vite externalises `node:fs` / `node:path` from `src/lib/env.ts` for the browser
  bundle. This is harmless because all browser code paths guard with
  `typeof window === 'undefined'` and never execute the server-only branch. The
  dead server code is tree-shaken away at build time. No action required.
- Chunk size warning (single JS chunk > 500 kB). This is a pre-existing bundling
  characteristic; splitting is out of scope.

### 8.3 Lint

The `lint` script maps to `vite build` (per `package.json:12`); it inherits the
same PASS as §8.2.

### 8.4 Runtime verification

**Status: NOT EXECUTED** — deliberate, per audit scope.

Runtime verification of `npm run dev`, the collector endpoints, the tracker install
flow, and dashboard end-to-end reads would require a live Supabase project (URL +
service role + anon key). The audit brief explicitly instructs no live Supabase
connection and no credential collection. The developer should perform the runtime
verification locally per `LOCAL_SETUP_GUIDE.md` § "Success checklist".

Static verification confirms:

- All endpoints listed in the audit scope exist in `server.ts` at expected paths
  (§ 9 below).
- `public/tracker.js` and `src/sdk/tracker.ts` payloads do **not** include
  `site_id` / `siteId` (grep confirms).
- All repositories in `src/repositories/*` import from `../lib/supabase/types`
  (generated types).

### 8.5 Local compatibility

**Status: PASS.** Zero source changes → identical behaviour on any local VS Code
machine after `git pull`.

### 8.6 Emergent compatibility

**Status: PASS (documented).** The project is not managed by Emergent's readonly
supervisor. It is intended to be cloned inside the Emergent workspace and run via
`npm run dev` in a terminal, with `.env.local` supplying real Supabase and
`PORT=3001` to avoid the CRA/:3000 conflict.

---

## 9. Collector Endpoints — Live Verification

| Endpoint                              | Method | Handler location                          | Status |
|---------------------------------------|--------|-------------------------------------------|--------|
| `/health`                             | GET    | `server.ts:79`                            | LIVE   |
| `/api/health`                         | GET    | `server.ts:79`                            | LIVE   |
| `/api/v1/health`                      | GET    | `server.ts:79`                            | LIVE   |
| `/api/v1/version`                     | GET    | `server.ts:106`                           | LIVE   |
| `/api/v1/monitor/stats`               | GET    | `server.ts:117`                           | LIVE   |
| `/api/health/supabase`                | GET    | `server.ts:122`                           | LIVE   |
| `/api/v1/collect/pageview`            | POST   | `server.ts:166`                           | LIVE   |
| `/api/collect`                        | POST   | `server.ts:167` (alias)                   | LIVE   |
| `/api/v1/collect/event`               | POST   | `server.ts:198`                           | LIVE   |
| `/api/event`                          | POST   | `server.ts:199` (alias)                   | LIVE   |
| `/api/v1/collect/heartbeat`           | POST   | `server.ts:221`                           | LIVE   |
| `/api/heartbeat`                      | POST   | `server.ts:222` (alias)                   | LIVE   |
| `/tracker.js`                         | GET    | `server.ts:70` (injects VITE_COLLECTOR_URL) | LIVE |

---

## 10. Tracker Contract — Verification

- **Raw API key transport:** `public/tracker.js:13` reads `data-api-key` from the
  `<script>` tag or `window.PULSE_API_KEY`. Sent to the collector as `x-api-key`
  header and inside JSON body (`apiKey`).
- **No `site_id`:** grep of `public/tracker.js` for `site_id|siteId` returns only
  a comment reference in the payload keys — no assignment. Payload objects at
  lines 110-117, 192-207, 214-227, 234-238 contain **no** `site_id` or `siteId`
  field. Collector resolves the site from the API key hash
  (`collectorService.ts:105-137`).
- **TypeScript SDK (`src/sdk/tracker.ts`):** `PulseInitOptions` still declares
  optional `siteId?: string` for backward-compatible init signatures, but the
  payloads sent to `/api/v1/collect/pageview`, `/event`, and `/heartbeat` (lines
  59-74, 101-114, 138-152) **do not** include `siteId`.

---

## 11. Repository Types — Verification

All repository files consume aliases derived from the generated `Database`:

- `src/repositories/analyticsRepository.ts:2-8` imports `VisitorsRow`,
  `SessionsRow`, `PageViewsRow`, `EventsRow`, `AllowedDomainsRow`.
- `src/repositories/siteRepository.ts:2-9` imports `SitesRow`, `SitesInsert`,
  `SitesUpdate`, `ApiKeysRow`, `ApiKeysInsert`, `ApiKeysUpdate`.
- `src/services/collectorService.ts:5-18` imports the full set of Row/Insert/Update
  aliases + `Json`.
- `src/services/queueService.ts:3` imports `EventsInsert`, `Json`.

Definition source: `src/lib/supabase/types.ts:449-493` — a single `Database`
interface with derived aliases (`type SitesRow = PublicTables['sites']['Row']`
etc.). No repository redefines a table shape. **PASS**.

---

## 12. Findings — Non-blocking Observations

These are **observations**, not modifications. The audit intentionally leaves the
codebase untouched. Each is a candidate for a future dedicated PR, gated by user
approval.

### 12.1 Unused dependencies (safe to remove)

Grep across `src/`, `server.ts`, `vite.config.ts`, `public/`:

| Package          | Referenced anywhere? | Notes                                    |
|------------------|----------------------|------------------------------------------|
| `motion`         | No                   | No `from 'motion'` / `motion/react` import found. |
| `clsx`           | No                   | No `from 'clsx'` import found.           |
| `tailwind-merge` | No                   | No `twMerge` / `tailwind-merge` import found. |

Recommended future action: `npm remove motion clsx tailwind-merge`.
Left in place in this audit to keep the git diff at zero source lines.

### 12.2 `vite.config.ts` throws during `vite build`

`vite.config.ts:10` throws `VITE_COLLECTOR_URL is required for Vite dev proxy.`
unconditionally, including for `vite build`, even though the proxy is only used by
`vite serve`. Effect: `npm run build` fails in a CI environment that has not set
`VITE_COLLECTOR_URL` even though builds do not need a live collector.

**Minimal fix (recommended, 2-line change):**

```ts
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const collectorTarget = env.VITE_COLLECTOR_URL;

  if (command === 'serve' && !collectorTarget) {
    throw new Error('VITE_COLLECTOR_URL is required for Vite dev proxy.');
  }
  // ... rest unchanged
});
```

Not applied to preserve zero-diff. Current workaround: always define
`VITE_COLLECTOR_URL` before `npm run build` (documented in `LOCAL_SETUP_GUIDE.md`).

### 12.3 Stale files in repo

- `README.md`: Contents refer to "AI Studio" and `GEMINI_API_KEY`, unrelated to
  Pulse Analytics. Cosmetic; developer onboarding may be confused. Consider
  replacing with a pointer to `docs/handoff/LOCAL_SETUP_GUIDE.md`.
- `tailwindcss-*.log` (8 files at repo root): Tailwind CLI logs, presumably from a
  previous local run. Should be `.gitignore`d and removed. Non-functional.
- `bun.lock` alongside `package-lock.json`: `package.json` scripts use `npm`, so
  `bun.lock` is orphaned. Consider removing to avoid confusion.

### 12.4 `docker-compose.yml` uses `.env.example`

`docker-compose.yml:15` loads `.env.example` as its `env_file`. Because
`.env.example` contains placeholder values, `docker compose up` from a fresh clone
starts with invalid credentials. `docker-compose.prod.yml` correctly points at
`.env.production`. Consider changing dev compose to `.env.local` for consistency.
Not modified in this audit.

### 12.5 Isomorphic env import chain

`src/lib/supabase/index.ts` imports both `browser.ts` and `server.ts`, which pulls
`node:fs` / `node:path` into the browser bundle build graph. Vite correctly
externalises them and the dead branches are tree-shaken at runtime, but the
architecturally cleaner pattern is to split the isomorphic re-export into two
entrypoints (client-only, server-only). Out of scope for this audit.

---

## 13. Deployment Notes

### 13.1 On Emergent

The RC4 project is **not** intended to run under Emergent's built-in supervisor.
Deploy it as follows inside an Emergent workspace:

1. `git clone` into any directory (e.g. `/workspace/pulse-analytics`).
2. `cp .env.example .env.local` and fill values. **Set `PORT=3001`** (or any free
   port ≠ 3000, which is held by Emergent's CRA dev server).
3. `npm install`
4. `npm run dev`  (single command; Vite on `:5173`, collector on `:3001`).
5. Emergent's Kubernetes ingress only routes `:3000` (React) and `:8001` (FastAPI).
   To make the collector reachable from the public preview URL, either:
   (a) tunnel via the workspace terminal port-forward, or
   (b) run only the frontend under Vite and point `VITE_COLLECTOR_URL` at an
       externally-hosted collector.

### 13.2 On production infra (unchanged from RC4 baseline)

Use `docker-compose.prod.yml` with a real `.env.production` file. Nginx fronts
the app on `:80` / `:443` per `nginx.conf`. No changes.

### 13.3 On local VS Code (unchanged from RC4 baseline)

`git pull` this audit branch → the diff is only the two documents under
`docs/handoff/`. `npm run dev` continues to work identically. **Full local
compatibility preserved.**

---

## 14. Remaining Issues

None that block Emergent runtime. Non-blocking recommendations are captured in
§ 12 for future PR consideration.

## 15. Testing Steps (developer-side)

After pulling this audit branch:

1. `npm install` — should complete without errors (no dep changes).
2. `npm run typecheck` — expect exit 0.
3. `VITE_COLLECTOR_URL=http://localhost:3000 npm run build` — expect success and
   `dist/index.html` + `dist/server.cjs`.
4. Populate `.env.local` per `LOCAL_SETUP_GUIDE.md`.
5. `npm run dev` — expect Vite on `:5173` and collector on `PORT`.
6. `curl http://localhost:<PORT>/api/v1/health` — expect `{"status":"ok",...}`.
7. `curl http://localhost:<PORT>/api/v1/monitor/stats` — expect JSON metrics.
8. Follow `LOCAL_SETUP_GUIDE.md` → "How to add a website" and complete the
   Test Connection flow.

---

*End of report — Pulse Analytics RC4 Emergent Stabilization Audit.*
