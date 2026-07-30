# Pulse Analytics RC4.1 — Live Supabase Validation Report

**Baseline:** RC4 + stabilization commits `6696086` (docs) + `2570308` (unused-dep cleanup)
**Validation mode:** Static verification only. Live Supabase execution was
explicitly deferred by the repository owner (option "c"). Live credentials were
neither collected nor requested, in accordance with the audit-mode constraint.
**Report location:** `docs/RC4_LIVE_VALIDATION_REPORT.md`
**Git diff for this phase:** 1 file (this report). Zero source, config, dependency, or schema changes.

---

## 0. Verdict Summary

| Area                              | Static | Live      |
|-----------------------------------|--------|-----------|
| Environment variable coverage     | PASS   | n/a       |
| Supabase client wiring            | PASS   | n/a       |
| Repository ↔ schema type match    | PASS   | n/a       |
| Collector endpoint contract       | PASS   | n/a       |
| Tracker payload contract          | PASS   | n/a       |
| Installation Manager UI wiring    | PASS   | n/a       |
| Security posture                  | PASS   | n/a       |
| End-to-end data flow              | n/a    | NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS |
| Dashboard widget accuracy         | n/a    | NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS |
| Realtime channel                  | n/a    | NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS |
| Reports accuracy                  | n/a    | NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS |
| Performance metrics               | n/a    | NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS |

**Final Verdict:** **PASS WITH WARNINGS** — every check reachable without live
credentials passes. All live-only sections are cleanly marked with intended
verification, local execution steps, expected results, and failure scenarios so
the repository owner can complete validation without further assistance.

---

## 1. Environment (Step 1)

Required variables presence in `.env.example`:

| Variable                       | Present in `.env.example` | Consumer                                                 |
|--------------------------------|---------------------------|----------------------------------------------------------|
| `SUPABASE_URL`                 | present                   | `src/lib/supabase/server.ts:12`                          |
| `SUPABASE_SERVICE_ROLE_KEY`    | present                   | `src/lib/supabase/server.ts:13`                          |
| `VITE_SUPABASE_URL`            | present                   | `src/lib/supabase/browser.ts:13`                         |
| `VITE_SUPABASE_ANON_KEY`       | present                   | `src/lib/supabase/browser.ts:14`                         |
| `VITE_COLLECTOR_URL`           | present                   | `vite.config.ts:8`, `src/sdk/tracker.ts:24`, `server.ts:73` (injection into `public/tracker.js`) |
| `ALLOWED_ORIGINS`              | present                   | `server.ts:18`, `src/services/collectorService.ts:187`   |
| `PULSE_COLLECTOR_VERSION`      | present                   | `server.ts:86`, `src/services/queueService.ts:262`       |
| `PULSE_SDK_VERSION`            | present                   | `src/services/queueService.ts:261`                       |
| `INGESTION_QUEUE_BATCH_SIZE`   | present                   | `src/services/queueService.ts:75`                        |
| `INGESTION_QUEUE_FLUSH_MS`     | present                   | `src/services/queueService.ts:76`                        |
| `INGESTION_QUEUE_MAX_RETRY`    | present                   | `src/services/queueService.ts:77`                        |
| `RATE_LIMIT_IP_PER_MIN`        | present                   | `queueService` rate limits                                |
| `RATE_LIMIT_KEY_PER_MIN`       | present                   | `queueService` rate limits                                |
| `PORT`                         | present                   | `server.ts:17`                                            |
| `NODE_ENV`                     | present                   | `server.ts:227`                                           |

**No variable is missing. No defaults are silently invented** — `src/lib/env.ts:58`
(`requireServerEnv`) fails fast on any missing key with a listed error.

**Verdict: PASS.**

### 1.1 Local (developer) responsibility

The `.env.example` file only contains placeholders. To perform live validation
the developer must create `.env.local` and populate every value with real
credentials from the Supabase project dashboard (Project Settings → API):

- `SUPABASE_URL` and `VITE_SUPABASE_URL` = same project URL
- `VITE_SUPABASE_ANON_KEY` = anon (public) key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role (secret) key — server only

---

## 2. Supabase Connectivity (Step 2)

### 2.1 Client uniqueness

Grep of `createClient` across `src/`:

```
src/lib/supabase/server.ts:15   createClient<Database>(url, serviceRoleKey, { ... })
src/lib/supabase/browser.ts:21  createClient<Database>(url, anonKey, { ... })
```

**Exactly two `createClient` call sites — one server, one browser.** Both are
module-level singletons (`let serverClient|browserClient: SupabaseClient<Database>
| null = null`) reused across the app.

### 2.2 Consumers

| Consumer                                         | Uses client from                                | Verdict |
|--------------------------------------------------|-------------------------------------------------|---------|
| `src/lib/supabase.ts` (isomorphic re-export)     | branches on `typeof window`                     | Shared  |
| `src/repositories/analyticsRepository.ts`        | `import { supabase } from '../lib/supabase'`    | Shared  |
| `src/repositories/siteRepository.ts`             | `import { supabase } from '../lib/supabase'`    | Shared  |
| `src/services/collectorService.ts:20-23`         | `getServerSupabase()` (server client only)      | Shared  |
| `src/services/queueService.ts:5-8`               | `getServerSupabase()` (server client only)     | Shared  |
| `src/services/analyticsService.ts`               | Via repositories (indirect)                    | Shared  |
| `src/services/authService.ts`                    | Via `getBrowserSupabase()`                     | Shared  |
| `src/components/*View.tsx`                        | Via services / repositories (never direct)     | Shared  |

**No duplicate `createClient`. No hardcoded credentials. No credential
duplication.** Every consumer routes through the two singletons.

### 2.3 Cross-boundary leak checks

- `process.env` in browser-facing code: grep in `src/lib/supabase/browser.ts`,
  `src/components/**`, `src/App.tsx`, `src/main.tsx`, `src/sdk/**` → **zero
  hits**.
- `import.meta.env` in server-only code (`server.ts`, `src/services/collector*`,
  `queueService`, `lib/env.ts`, `lib/supabase/server.ts`) → **zero hits**.
- The two `import.meta.env` matches in `src/services/analyticsService.ts:642,645`
  are guarded by `typeof import.meta !== 'undefined'` and only run in the
  browser-side "Integration Verification" checklist — **correct pattern**, not a
  cross-boundary leak.

**Verdict: PASS.**

---

## 3. Repository ↔ Schema Type Compatibility (Step 3)

Single source of truth: `src/lib/supabase/types.ts:9-443` (the `Database`
interface). Derived aliases: `types.ts:449-493`.

### 3.1 Alias coverage per table

| Table              | Row                  | Insert                  | Update                  | Repository                                              |
|--------------------|----------------------|-------------------------|-------------------------|---------------------------------------------------------|
| `sites`            | `SitesRow`           | `SitesInsert`           | `SitesUpdate`           | `siteRepository.ts:2-9`                                 |
| `api_keys`         | `ApiKeysRow`         | `ApiKeysInsert`         | `ApiKeysUpdate`         | `siteRepository.ts:2-9`, `collectorService.ts:7`        |
| `visitors`         | `VisitorsRow`        | `VisitorsInsert`        | `VisitorsUpdate`        | `analyticsRepository.ts:3`, `collectorService.ts:8-10`  |
| `sessions`         | `SessionsRow`        | `SessionsInsert`        | `SessionsUpdate`        | `analyticsRepository.ts:4`, `collectorService.ts:11-13` |
| `page_views`       | `PageViewsRow`       | `PageViewsInsert`       | `PageViewsUpdate`       | `analyticsRepository.ts:5`, `collectorService.ts:14-15` |
| `events`           | `EventsRow`          | `EventsInsert`          | `EventsUpdate`          | `analyticsRepository.ts:6`, `queueService.ts:3`, `collectorService.ts:16` |
| `allowed_domains`  | `AllowedDomainsRow`  | (unused)                | (unused)                | `analyticsRepository.ts:7`                              |

### 3.2 Operation coverage (repo ↔ Supabase call)

| Operation                                                        | Location                                          | Uses generated types |
|------------------------------------------------------------------|---------------------------------------------------|----------------------|
| `INSERT sites`                                                   | `siteRepository.ts:70-73`                          | `SitesInsert`        |
| `SELECT sites`                                                   | `siteRepository.ts:17-19,34-38`                    | `SitesRow`           |
| `UPDATE sites`                                                   | `siteRepository.ts:99-104`                         | `SitesUpdate`        |
| `DELETE sites`                                                   | `siteRepository.ts:119-122`                        | –                    |
| `INSERT api_keys`                                                | `siteRepository.ts:174-178`                        | `ApiKeysInsert`      |
| `UPDATE api_keys` (revoke, regenerate, touch `last_used_at`)     | `siteRepository.ts:200-204, 230-234`; `collectorService.ts:132` | `ApiKeysUpdate` |
| `INSERT visitors`                                                | `collectorService.ts:250-254`                      | `VisitorsInsert`     |
| `UPDATE visitors` (last_seen, totals)                            | `collectorService.ts:236, 345-347, 422-425, 546-547` | `VisitorsUpdate`   |
| `INSERT sessions`                                                | `collectorService.ts:335-339`                      | `SessionsInsert`     |
| `UPDATE sessions` (heartbeat, exit_page, page_count, is_online)  | `collectorService.ts:281-288, 302-308, 415-420, 497-499, 539-544` | `SessionsUpdate` |
| `INSERT page_views`                                              | `collectorService.ts:405-409`                      | `PageViewsInsert`    |
| `UPDATE page_views` (left_at, duration, scroll_depth, is_exit)   | `collectorService.ts:550-559`                      | `PageViewsUpdate`    |
| `INSERT events` (single)                                         | `collectorService.ts:487-491`                      | `EventsInsert`       |
| `INSERT events` (bulk from queue worker)                         | `queueService.ts:192-213`                          | `EventsInsert[]`     |
| `SELECT allowed_domains`                                         | `analyticsRepository.ts:245-247`                   | `AllowedDomainsRow`  |

**No repository redefines a table shape. No `any` casts around table Rows/Inserts.
The `Relationships[]` blocks in `types.ts` document every foreign key
(`api_keys.site_id → sites.id`, `visitors.site_id → sites.id`,
`sessions.{site_id,visitor_id}`, `page_views.{site_id,visitor_id,session_id}`,
`events.{site_id,visitor_id,session_id,page_view_id}`,
`allowed_domains.site_id`).**

### 3.3 Enum coverage

| Enum-typed column          | TS union in types.ts                                    | Consumer                                             |
|----------------------------|---------------------------------------------------------|------------------------------------------------------|
| `sites.status`             | `'active' \| 'archived' \| 'pending' \| 'suspended'`    | `siteRepository.createSite` (default `active`), `collectorService.findSite` |
| `api_keys.status`          | `'active' \| 'revoked' \| 'expired'`                    | `collectorService.validateApiKey`, `siteRepository.{revoke,regenerate}ApiKey` |

**Union types stay in sync with schema constraints; no repository writes a value
outside these unions.**

**Verdict: PASS.**

**IMPORTANT:** the report does not, and cannot, verify that the *database's
actual columns and enums* match `types.ts` without a live connection. The static
check confirms only that repositories are internally consistent against the
generated types. See § 4 for the equivalent live check.

---

## 4. End-to-End Data Flow (Step 4)

### 4.1 Status

**NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS.**

### 4.2 What was intended to be verified

For each of the following pipeline stages, a fresh row must be visible in the
respective Supabase table within the specified interval, without mocks and
without manual SQL:

| Stage                            | Expected artifact                                     | Table touched         |
|----------------------------------|-------------------------------------------------------|-----------------------|
| Create Site (UI: Sites → +)      | 1 row in `sites`                                      | `sites`               |
| Generate API Key (UI: API Keys → +) | 1 row in `api_keys` (`key_hash` = SHA-256 of raw)    | `api_keys`            |
| Copy install snippet             | Snippet contains only `data-api-key`, no `data-site-id` | –                   |
| Install on real website          | `<script src="…/tracker.js" data-api-key="…">`        | –                   |
| First page load                  | 1 request each: `/api/v1/collect/pageview`, later `/heartbeat` | –           |
| Collector validates API Key      | `api_keys.last_used_at` updated                       | `api_keys`            |
| Collector resolves `site_id`     | (implicit — subsequent inserts target this site_id)   | –                     |
| Visitor upsert                   | 1 row in `visitors` (or `last_seen_at` bumped)        | `visitors`            |
| Session upsert                   | 1 row in `sessions` with `is_online=true`             | `sessions`            |
| Page view insert                 | 1 row in `page_views`                                 | `page_views`          |
| Heartbeat                        | `sessions.last_activity_at` + `duration_seconds` bump | `sessions`, optionally `page_views` |
| Custom event (e.g., click)       | 1 row in `events`                                     | `events`              |
| Dashboard refresh                | KPI cards reflect the new counts                       | – (reads)             |
| Realtime tab                     | Online visitor appears within <10 s                   | – (subscription)      |
| Reports tab                      | Top Pages / Referrers / Countries populated           | – (reads)             |
| Integration Verification         | All 9 checklist items PASS                            | – (reads)             |

### 4.3 How to execute locally

```bash
# 1. Prepare env
cp .env.example .env.local
# fill in real values from Supabase Dashboard → Project Settings → API
# set PORT=3001 if 3000 is taken

# 2. Boot
npm install
npm run dev
# expect: [client] :5173, [server] running on :3001

# 3. Smoke-check
curl -s http://localhost:3001/api/v1/health | jq
curl -s http://localhost:3001/api/health/supabase | jq

# 4. Open dashboard
open http://localhost:5173        # or your browser
#   → Sites tab → Add New Site → fill (name, domain, timezone)
#   → API Keys tab → Generate Key → COPY RAW KEY IMMEDIATELY
#   → Tracking tab → Copy Snippet (verify: contains data-api-key, NOT data-site-id)

# 5. Install tracker on a real page (locally-hostable minimum reproducer)
cat > /tmp/pulse-smoke.html <<'HTML'
<!doctype html><html><body>
  <h1>Pulse smoke test</h1>
  <button id="b">click me</button>
  <script>document.getElementById('b').addEventListener('click',()=>window.pulse.track('smoke_click',{category:'test'}));</script>
  <script src="http://localhost:3001/tracker.js" data-api-key="PASTE_RAW_KEY" async></script>
</body></html>
HTML
npx --yes http-server -p 8080 /tmp -c-1 &
open http://localhost:8080/pulse-smoke.html
# click the button once. wait 30s.

# 6. Verify each stage in Supabase SQL editor
select id, name, domain, status from sites order by created_at desc limit 1;
select id, site_id, name, key_prefix, status, last_used_at from api_keys order by created_at desc limit 1;
select id, site_id, visitor_uid, total_sessions, total_page_views from visitors order by last_seen_at desc limit 1;
select id, site_id, session_uid, landing_page, duration_seconds, is_online from sessions order by started_at desc limit 1;
select id, site_id, url, title, entered_at from page_views order by entered_at desc limit 1;
select id, site_id, event_name, event_category, occurred_at from events order by occurred_at desc limit 1;

# 7. In the dashboard
#   → Dashboard tab: KPI cards must show >=1 Visitor, Session, Page View
#   → Realtime tab: live count >=1 while smoke HTML is open
#   → Reports tab: Top Pages contains "/pulse-smoke.html"
#   → Sites → Integration Verification: all checklist items PASS
```

### 4.4 Expected successful result

- Every `select` above returns exactly the row you just produced.
- Dashboard KPIs match the row counts.
- Integration Verification page shows all 9 items green:
  `createSite ✓ generateApiKey ✓ trackerLoaded ✓ firstPageView ✓ firstVisitor ✓
  firstSession ✓ heartbeatReceived ✓ firstEvent ✓ dashboardUpdate ✓`.
- Log line per request:
  `{"level":"INFO","component":"CollectorAPI","message":"pageview processed",...}`.

### 4.5 Possible failure scenarios (with root cause & fix)

| Symptom                                                      | Likely root cause                                                                 | Fix (in `.env.local`, not in code)                       |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------|
| Collector returns `401 API Key missing`                      | Snippet omitted `data-api-key`, or raw key mistyped                               | Re-copy snippet from UI                                  |
| Collector returns `401 Invalid, revoked, or expired API Key` | `api_keys.key_hash` does not match SHA-256 of the raw key                         | Regenerate the API key; copy the raw output immediately  |
| Collector returns `403 Origin '…' is not allowed`            | `ALLOWED_ORIGINS=database` and the origin is not in `sites.domain` / `allowed_domains` | Either set `ALLOWED_ORIGINS` to a wildcard-CSV in dev, or add the origin's host to `allowed_domains` |
| Collector returns `500 Failed to create visitor record`      | Supabase RLS blocking service-role insert (schema drift)                          | Confirm RLS on `visitors` allows service_role; do NOT modify the schema per audit constraints — file a schema issue instead |
| Dashboard is empty despite Supabase rows                      | Browser bundle missing `VITE_SUPABASE_URL` / `ANON_KEY`; anon-key RLS blocking reads | Restart Vite; confirm anon-key SELECT policies on `sites`, `visitors`, `sessions`, `page_views`, `events` |
| Realtime tab empty                                            | Supabase Realtime is disabled on the affected tables                              | In Supabase Dashboard → Database → Replication, enable realtime for the 5 event tables |
| `page_views` inserted but `sessions.exit_page` never updates  | Concurrent updates lose to each other; queue backlog                              | Inspect `/api/v1/monitor/stats` for `retryQueueLength`, `failedInserts` |
| `duration_seconds` remains 0                                  | Heartbeat not firing (tab background)                                             | Keep the tab focused; verify network requests to `/heartbeat` every ~30s |

---

## 5. Dashboard Metric Accuracy (Step 5)

### 5.1 Status

**NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS.**

### 5.2 What was intended to be verified

For each widget, the value shown in the UI must equal the value computed from
the underlying table with the same time window applied. Widgets and their
sources are listed below (based on static tracing through
`src/services/analyticsService.ts` and repositories):

| Widget (view)                             | UI location                                          | Backing repository call                                          | Ground-truth SQL                                                                                                              |
|-------------------------------------------|------------------------------------------------------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Visitors (Dashboard)                       | `App.tsx:362`, `MetricCard`                          | `AnalyticsRepository.getVisitors`                                | `select count(distinct visitor_uid) from visitors where site_id = $1 and first_seen_at between $2 and $3`                     |
| Sessions (Dashboard)                       | `App.tsx:374`                                        | `AnalyticsRepository.getSessions`                                | `select count(*) from sessions where site_id = $1 and started_at between $2 and $3`                                           |
| Page Views (Dashboard)                     | `App.tsx:383`                                        | `AnalyticsRepository.getPageViews`                               | `select count(*) from page_views where site_id = $1 and entered_at between $2 and $3`                                         |
| Bounce Rate (Dashboard)                    | `App.tsx:393`                                        | derived: sessions with `page_count = 1`                          | `select 100.0 * count(*) filter (where page_count = 1) / nullif(count(*),0) from sessions where site_id = $1 and started_at between $2 and $3` |
| Avg Duration (Show More)                   | `App.tsx:414`                                        | avg of `sessions.duration_seconds`                               | `select avg(duration_seconds) from sessions where site_id = $1 and started_at between $2 and $3`                              |
| Pages / Session (Show More)                | `App.tsx:422`                                        | avg of `sessions.page_count`                                     | `select avg(page_count) from sessions where site_id = $1 and started_at between $2 and $3`                                    |
| Active Visitors (badge)                    | `App.tsx:266`                                        | `analyticsData.summary.activeVisitors`                            | `select count(distinct visitor_id) from sessions where site_id = $1 and last_activity_at > now() - interval '5 min'`          |
| Top Pages (Reports)                        | `ReportsView`                                        | aggregated in `analyticsService.ts` from `page_views`             | `select url, count(*) from page_views where site_id = $1 and entered_at between $2 and $3 group by url order by 2 desc limit 10` |
| Top Referrers                              | `ReportsView`                                        | aggregated from `sessions.referrer`                              | `select referrer, count(*) from sessions where site_id = $1 group by referrer order by 2 desc limit 10`                       |
| Top Countries                              | `ReportsView`, `GeographyView`                       | aggregated from `sessions.country_code`                          | `select country_code, count(*) from sessions where site_id = $1 group by country_code order by 2 desc limit 10`               |
| Devices / Browsers / OS                    | `TechnologyView`                                     | aggregated from `sessions.{device_type,browser,operating_system}` | `select device_type, count(*) from sessions where site_id = $1 group by device_type`                                          |
| Events (Reports)                           | `EventsView`                                         | `AnalyticsRepository.getEvents`                                  | `select event_name, event_category, count(*) from events where site_id = $1 group by 1,2`                                     |
| Online Visitors (Realtime)                 | `RealtimeView`                                       | `AnalyticsRepository.getOnlineSessions`                          | `select count(distinct visitor_id) from sessions where site_id = $1 and (is_online = true or last_activity_at > now() - interval '5 min')` |
| Queue / Worker / Latency (Platform Monitor)| `PlatformMonitorView`                                | `GET /api/v1/monitor/stats` (in-process `QueueService`)          | not database-backed; from `queueService.getMetrics()`                                                                          |
| Health                                     | Platform Monitor                                     | `GET /api/v1/health`                                             | not database-backed                                                                                                            |

### 5.3 How to execute locally

For each row in the table above:

1. Note the UI value.
2. Run the ground-truth SQL in the Supabase SQL editor with the same site_id and
   time window as the UI.
3. Confirm the values match. Small differences (<1) are acceptable for averages
   due to floor/round; exact match is expected for counts.

### 5.4 Expected successful result

All 15 widgets match their SQL ground-truth. Platform Monitor's Queue,
Worker, Latency reflect the in-process state of `QueueService` (deterministic;
`activeWorkers=1`, `queueLength=0` at rest).

### 5.5 Possible failure scenarios

- **UI value > SQL count:** stale cache or `refreshTrigger` not incrementing.
  Refresh browser. Not a data bug.
- **UI value < SQL count:** RLS policy hiding rows from anon key. Widen the
  policy for the `sites.owner` or use `select … using (true)` for read-only
  dashboards.
- **`bounceRate` NaN:** zero sessions in the window. Expected; UI shows `0%`.
- **Platform Monitor `supabaseStatus = disconnected`:** server-side supabase
  client failed to construct — check `SUPABASE_SERVICE_ROLE_KEY` freshness.

---

## 6. Installation Manager Verification (Step 6)

### 6.1 Static checks — PASS

- **Tracker snippet template** in `src/components/TrackingInstallationView.tsx`
  emits `<script src="{VITE_COLLECTOR_URL}/tracker.js" data-api-key="…" async>`.
  Grep of the file confirms **no `data-site-id`** or `siteId` attribute
  anywhere.
- **Framework variants** (HTML / React / Next / Vue / Laravel / WordPress) —
  every variant uses `data-api-key` only, matching `LOCAL_SETUP_GUIDE.md` §8.
- **Raw API key surface:** the raw key is generated server-side once at API-key
  creation, echoed to the UI **once**, and only its `SHA-256` hash is persisted
  in `api_keys.key_hash`. `src/services/collectorService.ts:25-28`.
- **Collector URL surface:** the UI reads `import.meta.env.VITE_COLLECTOR_URL`
  in the browser and `getRequiredEnv('VITE_COLLECTOR_URL')` at the server-side
  `/tracker.js` route (server-side substitution guarantees the delivered JS
  never contains the placeholder even if the browser env is missing).
- **Test Connection:** fires real HTTP requests against
  `/api/v1/collect/pageview`, `/event`, `/heartbeat` using the raw API key
  (`TrackingInstallationView.tsx`); success requires HTTP 200/202 and a
  `{"success": true, ...}` body.
- **Integration Verification:** `analyticsService.ts:604-681` produces a
  9-checklist state that pulls only from Supabase repositories — no synthetic
  data.
- **Health Check button:** wired to `GET /api/health/supabase` returning
  `{environment, connectionTest}`.

### 6.2 site_id exposure audit

Search across all client-emitted payloads (`public/tracker.js:110-117, 192-207,
214-227, 234-238` and `src/sdk/tracker.ts:59-74, 101-114, 138-152`):
**no `site_id` or `siteId` field is ever assigned into a payload sent by the
tracker.** The collector resolves `site_id` internally from the API key hash:
`src/services/collectorService.ts:100-137`.

**Verdict: PASS.**

### 6.3 What live validation would add

Confirmation that the raw API key round-trip actually validates against the real
`api_keys.key_hash` and that Origin validation with `ALLOWED_ORIGINS=database`
consults the real `sites.domain` + `allowed_domains` rows. **Static verification
confirms the code path; live confirms the data.**

---

## 7. Security Audit (Step 7)

### 7.1 Static checks — PASS

| Concern                              | Evidence                                                                                     | Verdict |
|--------------------------------------|----------------------------------------------------------------------------------------------|---------|
| Service role key not in bundle       | `src/lib/supabase/browser.ts` imports **only** `VITE_SUPABASE_ANON_KEY`; no `SERVICE_ROLE` ref anywhere in browser code | PASS |
| Service role key not in tracker.js   | `public/tracker.js` — grep for `SERVICE_ROLE` returns 0 hits                                 | PASS |
| Anon key never used server-side      | `src/lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` only                           | PASS |
| API key hashing                      | SHA-256 in `collectorService.ts:25-28` using Node `crypto.createHash('sha256')`              | PASS |
| SHA-256 lookup                       | `collectorService.ts:105-137` compares `hashRawApiKey(rawApiKey)` to `k.key_hash`             | PASS |
| Origin validation                    | `collectorService.ts:169-212`: normalises host, whitelists `sites.domain` + `allowed_domains` when `ALLOWED_ORIGINS=database` | PASS |
| Allowed domains                       | Repository `getAllowedDomains` reads `allowed_domains` with FK to `sites.id`                 | PASS |
| Rate limiting                         | `queueService.ts:85-100` keyed by API key + IP; `RATE_LIMIT_IP_PER_MIN`, `RATE_LIMIT_KEY_PER_MIN` from env | PASS |
| Retry with backoff                    | `queueService.ts:228-239` requeues up to `INGESTION_QUEUE_MAX_RETRY`; drops with error log after   | PASS |
| Idempotency                           | `queueService.ts:103-122` with 10-min TTL cache; graceful duplicate acknowledgement           | PASS |
| Payload leakage                       | Collector logs use `Logger.warn/error` with structured JSON; **no raw API keys logged** (only `reqId`) | PASS |
| `.gitignore` protects secrets         | `.gitignore:1-4` covers `.env`, `.env.local`, `.env.production`, `.env.development`          | PASS |
| Committed `.env.example` has placeholders only | verified in Report §1                                                                | PASS |

### 7.2 What live validation would add

- Confirm the real `service_role` is **not** exposed by inspecting the
  production bundle at `dist/assets/index-*.js` — grep for the actual key
  fingerprint after a real build.
- Confirm RLS policies on every table gate anon access appropriately (only
  `select` for dashboard, no `insert/update/delete`).
- Confirm origin validation blocks a truly untrusted origin in end-to-end.

### 7.3 Recommendations

- `RATE_LIMIT_*` values in `.env.example` (100 IP/min, 1000 key/min) are
  reasonable for dev. **Recommend** production values calibrated per-tenant.
- Consider adding `SameSite=Lax` and `Secure` cookie hints if session storage is
  ever moved from `localStorage` — currently N/A because the tracker uses only
  `localStorage` / `sessionStorage`.

---

## 8. Performance Validation (Step 8)

### 8.1 Status

**NOT EXECUTED — REQUIRES LIVE SUPABASE CREDENTIALS.**

Static reasoning notes only:

- Collector inserts one visitor + one session + one page_view per pageview, with
  one API-key lookup that currently does a **full-table scan** on `api_keys`
  (`collectorService.ts:112`). This is acceptable at low tenant count but
  becomes O(n) with number of keys. Not a bug per audit constraints; noted for
  the roadmap.
- Queue batch size default 50 with 500 ms flush; theoretical throughput
  ≈ 100 events/s single-threaded per pod, ceiling set by Supabase insert
  latency.

### 8.2 What was intended to be measured

| Metric                          | How                                                                                        | Target (RC4 SLA)      |
|---------------------------------|--------------------------------------------------------------------------------------------|-----------------------|
| Collector response time (p50/p95) | `curl -o /dev/null -w '%{time_total}' … /api/v1/collect/pageview` × 100                    | p50 < 100 ms, p95 < 300 ms |
| Database insert latency           | `queueService.getMetrics().avgInsertTimeMs` after 1k events                                | avg < 50 ms per batch |
| Queue latency                     | Time from HTTP 200 to Supabase row visible (SQL polling)                                   | < 1 s                 |
| Dashboard refresh time            | Browser DevTools performance panel: time from `Refresh` click to KPI update                | < 800 ms              |
| Realtime latency                  | Time from event insert to Realtime tab UI change                                           | < 3 s                 |
| Heartbeat interval                | `public/tracker.js:252` — 30 s focused / 60 s blurred                                       | Adaptive              |
| SDK retry timing                  | Fails → IndexedDB persist → `online` event flush; measure via DevTools offline toggle       | Retries on reconnect  |

### 8.3 How to execute locally

```bash
# Cold-start metrics
time curl -s -o /dev/null http://localhost:3001/api/v1/health

# Load test collector (adjust N)
seq 1 100 | xargs -P 10 -I{} curl -s -X POST http://localhost:3001/api/v1/collect/pageview \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $RAW_API_KEY" \
  -d '{"url":"https://example.com/","title":"Load test '{}'"}' \
  -w '%{time_total}\n' -o /dev/null | sort -n | awk '
    BEGIN{c=0} {a[c++]=$1} END{print "p50=",a[int(c*0.5)]," p95=",a[int(c*0.95)]}'

# Watch queue drain
watch -n 1 'curl -s http://localhost:3001/api/v1/monitor/stats | jq .'
```

### 8.4 Expected successful result

- p50 < 100 ms and p95 < 300 ms on a laptop against a nearby Supabase region.
- `avgInsertTimeMs` stabilises < 50 ms once warm.
- `queueLength` returns to 0 within ~2 s after burst.

### 8.5 Possible failure scenarios

- p95 > 1 s → Supabase region distance / cold Postgres wake-up. Not a code bug.
- `failedInserts` climbing → RLS blocking service-role insert, or column
  mismatch → run `select * from information_schema.columns where table_name in
  ('visitors','sessions','page_views','events')` and cross-check against
  `src/lib/supabase/types.ts` Insert types.
- `queueLength` growing unbounded → Supabase timeout or `SERVICE_ROLE_KEY`
  revoked mid-run.

---

## 9. Issues Found

None that block RC4 in static mode. Non-blocking observations carry over from
the prior audit (Report `EMERGENT_ANALYSIS_REPORT.md` §12) and remain
non-blocking:

- **Stale files**: `README.md` (AI Studio refs), 8 committed `tailwindcss-*.log`
  files, orphan `bun.lock`. Cosmetic only.
- **`vite.config.ts:10` guard fires for `vite build` even outside dev proxy.**
  Documented workaround: define `VITE_COLLECTOR_URL` before `vite build`. Not
  patched to preserve zero-diff.
- **`docker-compose.yml` env_file: `.env.example`**: dev compose loads
  placeholders; use `docker-compose.prod.yml` or override for real work.
- **`collectorService.validateApiKey` full-table scan on `api_keys`**: O(n)
  lookup. Not a bug; a roadmap performance item.

---

## 10. Files Modified (This Phase)

| File                                        | Reason                              | Impact  |
|---------------------------------------------|-------------------------------------|---------|
| `docs/RC4_LIVE_VALIDATION_REPORT.md` (new)  | Required deliverable (Step 9)       | Doc-only |

**No source, config, dependency, or schema change.** Git diff for this phase =
1 new file.

---

## 11. Recommendations (post-RC4, non-blocking)

1. Owner runs Steps 4–5–8 locally per §4.3, §5.3, §8.3 to close out the report.
2. If the roadmap allows, batch the four non-blocking items from Report §12
   into a single "RC4 hygiene" PR: remove stale README, `.gitignore` the
   `tailwindcss-*.log` pattern, patch `vite.config.ts` guard (2-line, see prior
   audit §12.2), and add an index on `api_keys.key_hash` for O(log n) lookup.
3. Enable Supabase Realtime replication on the 5 event tables if not already —
   required for the Realtime tab to show any data.
4. Rotate `SUPABASE_SERVICE_ROLE_KEY` before public preview links are shared.

---

## 12. Final Verdict

**PASS WITH WARNINGS.**

- **Static verification: PASS** on every check reachable without live
  credentials (env coverage, client uniqueness, type-schema alignment,
  security posture, tracker contract, installation flow).
- **Live verification: NOT EXECUTED** for every check that requires real
  Supabase credentials, per the repository owner's explicit instruction. Each
  such check is documented with: *intended verification*, *local execution
  steps*, *expected successful result*, *possible failure scenarios* — so the
  owner can complete them without further assistance.

The RC4 baseline is production-ready pending the owner-executed live checklist.

---

*End of Pulse Analytics RC4.1 Live Supabase Validation Report.*
