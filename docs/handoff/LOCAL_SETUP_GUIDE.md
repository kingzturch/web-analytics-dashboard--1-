# Pulse Analytics — Local Setup Guide

Complete step-by-step guide to run the RC4 baseline on your machine (macOS / Linux
/ Windows) or inside an Emergent workspace. This document assumes you have **no
prior context** about the project.

---

## 1. Prerequisites

| Tool     | Minimum version | Recommended | How to check           |
|----------|-----------------|-------------|------------------------|
| Node.js  | 20.x LTS        | 20.20+      | `node --version`       |
| npm      | 10.x            | 10.8+       | `npm --version`        |
| Git      | 2.30+           | 2.40+       | `git --version`        |

- The project is pinned to Node 20 LTS via engines-compatible dev deps
  (`@types/node@^22`, `vite@^6`, `esbuild@^0.28`). Node 18 works but is not
  supported. Node 22 works.
- **Do not use `bun` or `pnpm`.** The lockfile in use is `package-lock.json`.
  (There is a stale `bun.lock` — ignore it.)
- A working **Supabase project** with the RC4 schema already applied.
  Non-negotiable: this audit does not include the migration files; assume the
  schema is already provisioned.

---

## 2. Clone

```bash
git clone https://github.com/kingzturch/web-analytics-dashboard--1-.git pulse-analytics
cd pulse-analytics
```

Latest branch: `main`. No submodules.

---

## 3. Install Dependencies

```bash
npm install
```

Expected: ~380 packages, no peer-dep errors. If npm warns about deprecated
sub-deps of `@types/*`, that is expected and harmless.

**Do NOT run `npm audit fix --force`** — it can silently break Vite 6 / React 19
transitive resolutions.

---

## 4. Create `.env.local`

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill every value. Below is the full reference.

### 4.1 Runtime

| Variable        | Purpose                                                | Example                       |
|-----------------|--------------------------------------------------------|-------------------------------|
| `PORT`          | Port for the Express Collector API                     | `3000` (local) / `3001` (Emergent) |
| `NODE_ENV`      | `development` for local, `production` for `npm start`   | `development`                 |

### 4.2 Supabase — Browser (client-side, `VITE_*`)

| Variable                 | Purpose                                     | Where to get it |
|--------------------------|---------------------------------------------|-----------------|
| `VITE_SUPABASE_URL`      | Public Supabase project URL                 | Supabase Dashboard → Project Settings → API → *Project URL* |
| `VITE_SUPABASE_ANON_KEY` | Anon (RLS-scoped) key. Safe for client bundle | Supabase Dashboard → Project Settings → API → *Project API keys* → `anon` `public` |

### 4.3 Supabase — Server (Node, non-VITE)

| Variable                       | Purpose                                             | Where to get it |
|--------------------------------|-----------------------------------------------------|-----------------|
| `SUPABASE_URL`                 | Same URL as above, but read by Node                 | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY`    | Elevated key for the collector to bypass RLS on ingest | Supabase Dashboard → Project Settings → API → *Project API keys* → `service_role` **secret** |

> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in client code or commit it. The
> project already gitignores `.env.local`. Keep it that way.

### 4.4 Collector / SDK

| Variable                          | Purpose                                                    | Example                          |
|-----------------------------------|------------------------------------------------------------|----------------------------------|
| `VITE_COLLECTOR_URL`              | Public base URL of the collector, injected into `tracker.js` and used by Vite dev proxy | `http://localhost:3000` (dev) or `https://analytics.your-domain.com` (prod) |
| `VITE_PULSE_SDK_VERSION`          | Version tag exposed to client                              | `1.0.0`                          |
| `VITE_PULSE_COLLECTOR_VERSION`    | Version tag exposed to client                              | `1.0.0-RC4`                      |
| `PULSE_SDK_VERSION`               | Same, read by Node                                         | `1.0.0`                          |
| `PULSE_COLLECTOR_VERSION`         | Same, read by Node                                         | `1.0.0-RC4`                      |

### 4.5 Ingestion Queue

| Variable                          | Purpose                                            | Recommended |
|-----------------------------------|----------------------------------------------------|-------------|
| `INGESTION_QUEUE_BATCH_SIZE`      | Max items flushed per worker tick                  | `50`        |
| `INGESTION_QUEUE_FLUSH_MS`        | Worker flush interval (ms)                         | `500`       |
| `INGESTION_QUEUE_MAX_RETRY`       | Max retries per failed insert                      | `5`         |

### 4.6 Security

| Variable                    | Purpose                                                                 | Recommended |
|-----------------------------|-------------------------------------------------------------------------|-------------|
| `RATE_LIMIT_IP_PER_MIN`     | Max requests per IP per minute                                          | `100`       |
| `RATE_LIMIT_KEY_PER_MIN`    | Max requests per API key per minute                                     | `1000`      |
| `ALLOWED_ORIGINS`           | Comma-separated CORS whitelist, or literal `database` to defer to `sites.domain` + `allowed_domains` | `http://localhost:5173,http://localhost:3000` (dev) |

### 4.7 Complete `.env.local` (local dev, copy-paste)

```dotenv
PORT=3000
NODE_ENV=development

VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

VITE_COLLECTOR_URL=http://localhost:3000
VITE_PULSE_SDK_VERSION=1.0.0
VITE_PULSE_COLLECTOR_VERSION=1.0.0-RC4
PULSE_SDK_VERSION=1.0.0
PULSE_COLLECTOR_VERSION=1.0.0-RC4

INGESTION_QUEUE_BATCH_SIZE=50
INGESTION_QUEUE_FLUSH_MS=500
INGESTION_QUEUE_MAX_RETRY=5

RATE_LIMIT_IP_PER_MIN=100
RATE_LIMIT_KEY_PER_MIN=1000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 5. Run in Development

```bash
npm run dev
```

This runs `concurrently -k -n client,server -c cyan,green "npm run dev:client"
"npm run dev:server"` — one command, two coloured process labels.

### 5.1 Expected output

```
[client]
[client]   VITE v6.x  ready in 480 ms
[client]
[client]   ➜  Local:   http://localhost:5173/
[client]   ➜  Network: http://0.0.0.0:5173/
[client]   ➜  press h + enter to show help
[server] {"timestamp":"2025-...","level":"INFO","component":"Server","message":"Pulse Analytics Collector API server running on http://0.0.0.0:3000"}
```

### 5.2 Processes started

| Label            | Bound to           | Serves                                                                 |
|------------------|--------------------|------------------------------------------------------------------------|
| Frontend (Vite)  | `http://localhost:5173` | React 19 dashboard SPA, HMR, `/api` + `/health` + `/tracker.js` proxied to `VITE_COLLECTOR_URL` |
| Backend (Express Collector) | `http://localhost:PORT`  | REST collector API, health, monitor, tracker delivery |
| Tracker delivery | `GET /tracker.js` on the backend | Serves the embeddable JS with `VITE_COLLECTOR_URL` injected |
| Monitor          | `GET /api/v1/monitor/stats` on the backend | JSON system stats consumed by the Platform Monitor view |
| Health           | `GET /health`, `GET /api/health`, `GET /api/v1/health` on the backend | JSON health + queue + Supabase status |

There is **no separate collector daemon** — backend and collector are the same
Express process. Tracker/Monitor/Health are simply routes on that process.

### 5.3 First smoke test

```bash
curl -s http://localhost:3000/api/v1/health | head
```

Expect:

```json
{"status":"ok","service":"Pulse Analytics Collector API","version":"1.0.0-RC4",...}
```

---

## 6. Run in Production

```bash
npm run build
```

- `vite build` → `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`
- `esbuild server.ts` → `dist/server.cjs` (CJS, external packages, sourcemap)

```bash
NODE_ENV=production PORT=3000 node dist/server.cjs
# OR
npm run start
```

The Express server serves the SPA statically from `dist/`, so port 5173 is not
used in production.

---

## 7. How to Add a Website (end-to-end)

Once the dashboard is up:

1. **Dashboard → Sites tab → “Add New Site”**
   Fill `name`, `domain` (e.g. `example.com`), optional `description`. Click
   *Create*. Row inserted into `sites` table.

2. **Sites → API Keys tab → “Generate Key”**
   Give it a name (`Production`, `Staging`, etc.). Copy the **raw key** that is
   shown **once**. The dashboard stores only the SHA-256 hash + prefix.

3. **Sites → Tracking tab**
   Copy the install snippet — it references your `VITE_COLLECTOR_URL` and injects
   the raw API key via `data-api-key`. **The snippet does NOT contain
   `data-site-id`** — the collector resolves the site from the API key.

4. **Install the snippet on your website**
   See § 8 for framework-specific variants.

5. **Test Connection**
   Sites → Tracking → *Test Connection* fires real requests against
   `/api/v1/collect/pageview`, `/event`, `/heartbeat` using the raw API key. All
   three must return `HTTP 200`/`202` with `{"success": true, ...}`.

6. **Verify Dashboard**
   Load your website in a real browser once → wait ~10s → open the Pulse
   Dashboard → the *Realtime* tab should show the visitor and the *Overview* tab
   should populate Visitors / Sessions / Page Views.

---

## 8. Tracker Installation Snippets

Replace `YOUR_COLLECTOR_URL` (e.g. `https://analytics.your-domain.com`) and
`YOUR_RAW_API_KEY` (e.g. `pa_live_...`) as printed by the dashboard.

### 8.1 Plain HTML

```html
<script
  src="YOUR_COLLECTOR_URL/tracker.js"
  data-api-key="YOUR_RAW_API_KEY"
  async>
</script>
```

### 8.2 React

```tsx
// src/analytics.tsx
import { useEffect } from 'react';

export function PulseTracker() {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'YOUR_COLLECTOR_URL/tracker.js';
    s.async = true;
    s.setAttribute('data-api-key', 'YOUR_RAW_API_KEY');
    document.head.appendChild(s);
  }, []);
  return null;
}
```

Then mount `<PulseTracker />` once in your app root.

### 8.3 Next.js (app router)

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="YOUR_COLLECTOR_URL/tracker.js"
          data-api-key="YOUR_RAW_API_KEY"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

### 8.4 Vue 3

```html
<!-- public/index.html or App.vue mounted -->
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const s = document.createElement('script');
  s.src = 'YOUR_COLLECTOR_URL/tracker.js';
  s.async = true;
  s.setAttribute('data-api-key', 'YOUR_RAW_API_KEY');
  document.head.appendChild(s);
});
</script>
```

### 8.5 Laravel Blade

```blade
{{-- resources/views/layouts/app.blade.php --}}
<script
  src="{{ config('services.pulse.collector_url') }}/tracker.js"
  data-api-key="{{ config('services.pulse.api_key') }}"
  async>
</script>
```

`config/services.php`:

```php
'pulse' => [
    'collector_url' => env('PULSE_COLLECTOR_URL'),
    'api_key'       => env('PULSE_API_KEY'),
],
```

### 8.6 WordPress

Add to `functions.php`:

```php
add_action('wp_head', function () {
    $collector = defined('PULSE_COLLECTOR_URL') ? PULSE_COLLECTOR_URL : '';
    $api_key   = defined('PULSE_API_KEY') ? PULSE_API_KEY : '';
    if (!$collector || !$api_key) return;
    printf(
        '<script src="%s/tracker.js" data-api-key="%s" async></script>',
        esc_url($collector),
        esc_attr($api_key)
    );
});
```

Define `PULSE_COLLECTOR_URL` and `PULSE_API_KEY` in `wp-config.php`.

---

## 9. Troubleshooting

### 9.1 Port conflict — `EADDRINUSE :::3000`

Emergent's built-in React CRA already binds `:3000`. Also happens if you have a
local Rails/Next/Docker service on `:3000`.

**Fix (one line, no code change):** in `.env.local` set

```dotenv
PORT=3001
VITE_COLLECTOR_URL=http://localhost:3001
```

Restart `npm run dev`. The tracker snippet you generate afterwards will already
point at `:3001`.

For Vite (`:5173`) conflicts: nothing configurable at the moment without editing
`vite.config.ts`. Kill the other process (`lsof -iTCP:5173 -sTCP:LISTEN`).

### 9.2 `Missing required Pulse Analytics environment variable(s): SUPABASE_URL, ...`

`src/lib/env.ts` fails fast when required envs are missing. Cause: `.env.local`
not created, or missing keys, or you launched from a different working
directory.

**Fix:** ensure `.env.local` exists in the repo root and contains every key
listed in § 4. Confirm with `cat .env.local | head`. Envs already exported in
your shell take precedence — check `env | grep SUPABASE`.

### 9.3 `[Pulse Analytics SDK] VITE_COLLECTOR_URL is required. Tracking disabled.`

`public/tracker.js:17` — the collector-served tracker did not substitute the
placeholder. Cause: the server started without `VITE_COLLECTOR_URL`.

**Fix:** set `VITE_COLLECTOR_URL` in `.env.local` and restart. `curl -sI
http://localhost:3000/tracker.js | head` should return `200 OK` and the served
JS should contain your real URL, not the literal `__PULSE_COLLECTOR_URL__`.

### 9.4 Collector offline / dashboard shows red status

`GET /api/v1/monitor/stats` returns `supabaseStatus: 'disconnected'`. Cause:
Supabase credentials wrong, project paused, or network blocked.

**Fix (in order):**

1. `curl -s http://localhost:3000/api/health/supabase | jq` — inspect the
   `environment` and `connectionTest` fields.
2. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present and match
   the same project as `VITE_SUPABASE_URL`.
3. Confirm the Supabase project is not paused (free-tier auto-pauses after 7d
   idle).
4. From the workspace terminal:
   `curl -s "$SUPABASE_URL/rest/v1/sites?select=id&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"`
   should return JSON, not HTML.

### 9.5 Tracker not sending

Symptoms: install snippet is on the page but *Realtime* stays empty.

**Fix (in order):**

1. Open your website in a real browser (not localhost of Vite dev) → DevTools
   Network tab → confirm `POST /api/v1/collect/pageview` is happening.
2. If it returns `401 Invalid, revoked, or expired API Key`: your `data-api-key`
   does not match any hash in `api_keys`. Re-copy the raw key from the dashboard;
   the raw key is only shown **once** — regenerate if lost.
3. If it returns `403 Origin '...' is not allowed`: either add your website's
   domain to `sites.domain` / `allowed_domains`, or set `ALLOWED_ORIGINS` to a
   non-`database` value in `.env.local`.
4. If it returns `CORS blocked` in the console: add your website's exact origin
   (scheme + host + port) to `ALLOWED_ORIGINS`, restart the server.

### 9.6 Supabase connection failure

`error creating supabase client: fetch failed` in the server log.

**Fix:**

- The service role key is correct but the project URL has a typo → double-check
  both.
- Corporate proxy blocking `*.supabase.co` → set `HTTPS_PROXY` env or run from a
  network with egress.
- Node 18 with older TLS defaults → upgrade to Node 20.

### 9.7 Empty dashboard even after successful test connection

Test Connection uses synthetic UIDs (`vis_test_...`, `ses_test_...`). Dashboard
metrics may filter these out or aggregate on a windowed period. Load a **real**
page in a real browser at least twice, wait 30s, refresh the dashboard.

If real pageviews are also missing, inspect `page_views` directly in Supabase
SQL editor:

```sql
select id, site_id, url, entered_at
from page_views
order by entered_at desc
limit 20;
```

If rows exist but the dashboard is empty → check the browser console for
`VITE_SUPABASE_ANON_KEY` errors and confirm RLS policies allow the anon role to
select the required tables.

---

## 10. Success Checklist

Tick every box before considering the setup done.

- [ ] `npm install` completes without errors.
- [ ] `npm run typecheck` prints no errors.
- [ ] `npm run build` writes `dist/index.html` and `dist/server.cjs`.
- [ ] `npm run dev` shows both `[client]` and `[server]` labels running.
- [ ] Dashboard opens at `http://localhost:5173`.
- [ ] `GET /api/v1/health` returns `{"status":"ok"}`.
- [ ] `GET /api/v1/monitor/stats` returns `supabaseStatus: "connected"`.
- [ ] `GET /tracker.js` returns JS that contains your real
      `VITE_COLLECTOR_URL` (no `__PULSE_COLLECTOR_URL__` literal).
- [ ] Site created + raw API key generated + snippet copied.
- [ ] Tracker installed on a real website (or a plain `test.html` served
      locally) — real pageview appears in Supabase `page_views` within 30s.
- [ ] Test Connection returns all three green: pageview, event, heartbeat.
- [ ] First website appears in the Dashboard *Sites* view with non-zero counts.

---

## 11. Emergent-Specific Notes

If you are running this inside an Emergent workspace instead of on your own
machine:

- The Emergent supervisor is **read-only** and already occupies `:3000` (CRA
  frontend) and `:8001` (FastAPI backend). **Do not** try to move the Pulse
  project into `/app/frontend` or `/app/backend`. Keep it in its own directory
  (any path works) and run `npm run dev` from a terminal.
- Set `PORT=3001` (or any free port ≠ 3000, 8001) in `.env.local`.
- Emergent's public preview URL routes only `:3000` and `/api → :8001`. The
  Pulse collector at `:3001` is **not** reachable from the public preview URL
  unless you deploy it externally. For local-only development inside the
  workspace, use `http://localhost:3001` in `VITE_COLLECTOR_URL`.
- No supervisor config edits are required. No `/etc/supervisor/conf.d/*.conf`
  changes. No `/app/backend` or `/app/frontend` edits.

---

## 12. Getting Help

- Every collector error is logged as a single JSON line to stderr; run
  `npm run dev 2>server.log` and inspect `server.log`.
- Frontend errors appear in the browser DevTools console with
  `[Pulse Analytics ...]` prefixes.
- `docs/handoff/EMERGENT_ANALYSIS_REPORT.md` contains the deeper architectural
  audit if you need to reason about internals.

---

*End of Local Setup Guide.*
