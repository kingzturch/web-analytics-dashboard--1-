# Pulse Analytics RC4 — Database Schema Reference

Definitive schema documentation. **Source of truth:** `src/lib/supabase/types.ts`.
Migration that materialises this schema: `supabase/migrations/001_rc4_complete_schema.sql`.

---

## 1. Table Inventory

| # | Table              | Purpose                                                        | Rows / lifetime          |
|---|--------------------|----------------------------------------------------------------|--------------------------|
| 1 | `sites`            | One row per website tracked                                    | Owner-managed            |
| 2 | `api_keys`         | Hashed access credentials for the collector, scoped to a site  | Owner-managed            |
| 3 | `visitors`         | Anonymous unique visitor across sessions                       | Written by collector     |
| 4 | `sessions`         | A single continuous visit (default idle timeout 30 min)         | Written by collector     |
| 5 | `page_views`       | Every URL loaded during a session, ordered                     | Written by collector     |
| 6 | `events`           | Custom events (clicks, custom `pulse.track(...)` calls)        | Written by collector     |
| 7 | `allowed_domains`  | Additional CORS/origin whitelist entries per site              | Owner-managed (optional) |

---

## 2. Relationship diagram

```
sites (id)
  │
  ├── api_keys           (site_id → sites.id,  ON DELETE CASCADE)
  │
  ├── allowed_domains    (site_id → sites.id,  ON DELETE CASCADE)
  │
  └── visitors           (site_id → sites.id,  ON DELETE CASCADE)
        │
        └── sessions     (visitor_id → visitors.id,  site_id → sites.id,  ON DELETE CASCADE)
              │
              ├── page_views  (session_id → sessions.id,  visitor_id, site_id, ON DELETE CASCADE)
              │
              └── events      (session_id → sessions.id,  page_view_id → page_views.id ON DELETE SET NULL,
                                visitor_id, site_id, ON DELETE CASCADE)
```

Every child table denormalises `site_id` for fast per-tenant reads without joins.

---

## 3. Per-table definition

### 3.1 `sites`

| Column        | Type                | Nullable | Default              | Notes                                                    |
|---------------|---------------------|----------|----------------------|----------------------------------------------------------|
| `id`          | uuid                | NOT NULL | `gen_random_uuid()`  | PK                                                       |
| `name`        | text                | NOT NULL | –                    | Display name in dashboard                                |
| `slug`        | text                | NOT NULL | –                    | UNIQUE, lowercased hyphenated form of `name`             |
| `domain`      | text                | NOT NULL | –                    | UNIQUE, canonical origin without protocol / trailing `/` |
| `description` | text                | nullable | –                    | Optional owner note                                      |
| `timezone`    | text                | NOT NULL | `'UTC'`              | IANA zone, e.g. `Asia/Jakarta`                           |
| `status`      | `site_status` enum  | NOT NULL | `'active'`           | `active`\|`archived`\|`pending`\|`suspended`             |
| `created_at`  | timestamptz         | NOT NULL | `now()`              |                                                          |
| `updated_at`  | timestamptz         | NOT NULL | `now()`              | Auto-touched by trigger                                  |

### 3.2 `api_keys`

| Column         | Type                    | Nullable | Default              | Notes                                                            |
|----------------|-------------------------|----------|----------------------|------------------------------------------------------------------|
| `id`           | uuid                    | NOT NULL | `gen_random_uuid()`  | PK                                                               |
| `site_id`      | uuid                    | NOT NULL | –                    | FK → `sites.id` (CASCADE)                                        |
| `name`         | text                    | NOT NULL | –                    | Human label (`Production`, `Staging`)                            |
| `key_prefix`   | text                    | nullable | –                    | First 12 chars of raw key + `...`, shown in the UI for identification |
| `key_hash`     | text                    | NOT NULL | –                    | UNIQUE. SHA-256 of the raw `pa_live_...` key. Raw key never stored |
| `status`       | `api_key_status` enum   | NOT NULL | `'active'`           | `active`\|`revoked`\|`expired`                                   |
| `expires_at`   | timestamptz             | nullable | –                    | Optional key rotation                                            |
| `last_used_at` | timestamptz             | nullable | –                    | Touched by collector on successful validation                    |
| `created_at`   | timestamptz             | NOT NULL | `now()`              |                                                                  |
| `updated_at`   | timestamptz             | NOT NULL | `now()`              | Auto-touched by trigger                                          |

### 3.3 `visitors`

| Column             | Type        | Nullable | Default              | Notes                                       |
|--------------------|-------------|----------|----------------------|---------------------------------------------|
| `id`               | uuid        | NOT NULL | `gen_random_uuid()`  | PK                                          |
| `site_id`          | uuid        | NOT NULL | –                    | FK → `sites.id` (CASCADE)                   |
| `visitor_uid`      | text        | NOT NULL | –                    | Stable anonymous ID generated in `tracker.js`; UNIQUE `(site_id, visitor_uid)` |
| `identified_user`  | text        | nullable | –                    | Owner-assigned identifier (e.g. logged-in user ID) |
| `first_seen_at`    | timestamptz | NOT NULL | `now()`              |                                             |
| `last_seen_at`     | timestamptz | NOT NULL | `now()`              | Updated by collector on every hit           |
| `total_sessions`   | integer     | NOT NULL | `0`                  | Bumped on new session                       |
| `total_page_views` | integer     | NOT NULL | `0`                  | Bumped on every pageview                    |
| `created_at`       | timestamptz | NOT NULL | `now()`              |                                             |
| `updated_at`       | timestamptz | NOT NULL | `now()`              | Auto-touched by trigger                     |

### 3.4 `sessions`

| Column             | Type        | Nullable | Default        | Notes                                                     |
|--------------------|-------------|----------|----------------|-----------------------------------------------------------|
| `id`               | uuid        | NOT NULL | `gen_random_uuid()` | PK                                                    |
| `site_id`          | uuid        | NOT NULL | –              | FK → `sites.id` (CASCADE)                                 |
| `visitor_id`       | uuid        | NOT NULL | –              | FK → `visitors.id` (CASCADE)                              |
| `session_uid`      | text        | NOT NULL | –              | UNIQUE                                                    |
| `started_at`       | timestamptz | NOT NULL | `now()`        |                                                           |
| `last_activity_at` | timestamptz | NOT NULL | `now()`        | Touched by every collector hit; drives `is_online`        |
| `duration_seconds` | integer     | NOT NULL | `0`            | Accumulated by heartbeats                                 |
| `landing_page`     | text        | NOT NULL | `''`           | First URL of the session                                  |
| `exit_page`        | text        | NOT NULL | `''`           | Last URL of the session so far                            |
| `page_count`       | integer     | NOT NULL | `0`            | Distinct page loads                                       |
| `referrer`         | text        | nullable | –              | `document.referrer` at session start                      |
| `country`          | text        | NOT NULL | `''`           | Full country name derived from IP (optional pipeline)     |
| `country_code`     | text        | NOT NULL | `''`           | ISO 3166-1 alpha-2                                        |
| `device_type`      | text        | NOT NULL | `''`           | `desktop`\|`mobile`\|`tablet`\|…                          |
| `browser`          | text        | NOT NULL | `''`           |                                                           |
| `operating_system` | text        | NOT NULL | `''`           |                                                           |
| `is_online`        | boolean     | NOT NULL | `true`         | Realtime flag, flipped to `false` after idle timeout      |
| `created_at`       | timestamptz | NOT NULL | `now()`        |                                                           |
| `updated_at`       | timestamptz | NOT NULL | `now()`        | Auto-touched by trigger                                   |

### 3.5 `page_views`

| Column             | Type        | Nullable | Default              | Notes                                          |
|--------------------|-------------|----------|----------------------|------------------------------------------------|
| `id`               | uuid        | NOT NULL | `gen_random_uuid()`  | PK                                             |
| `site_id`          | uuid        | NOT NULL | –                    | FK → `sites.id` (CASCADE)                      |
| `visitor_id`       | uuid        | NOT NULL | –                    | FK → `visitors.id` (CASCADE)                   |
| `session_id`       | uuid        | NOT NULL | –                    | FK → `sessions.id` (CASCADE)                   |
| `page_order`       | integer     | NOT NULL | –                    | 1-based position in session                    |
| `url`              | text        | NOT NULL | –                    | Full URL as observed                           |
| `path`             | text        | NOT NULL | –                    | Path component only                            |
| `query_string`     | text        | nullable | –                    | With leading `?`                               |
| `hash_fragment`    | text        | nullable | –                    | With leading `#`                               |
| `title`            | text        | NOT NULL | `''`                 | `<title>` at load                              |
| `referrer`         | text        | nullable | –                    | Immediate referrer of this pageview            |
| `entered_at`       | timestamptz | NOT NULL | `now()`              |                                                |
| `left_at`          | timestamptz | nullable | –                    | Set when the user navigates away               |
| `duration_seconds` | integer     | nullable | –                    | Computed on `left_at`                          |
| `scroll_depth`     | integer     | nullable | –                    | Max scroll % observed                          |
| `is_exit_page`     | boolean     | NOT NULL | `false`              | Set true for the last page of the session      |

### 3.6 `events`

| Column            | Type        | Nullable | Default              | Notes                                                    |
|-------------------|-------------|----------|----------------------|----------------------------------------------------------|
| `id`              | uuid        | NOT NULL | `gen_random_uuid()`  | PK                                                       |
| `site_id`         | uuid        | NOT NULL | –                    | FK → `sites.id` (CASCADE)                                |
| `visitor_id`      | uuid        | NOT NULL | –                    | FK → `visitors.id` (CASCADE)                             |
| `session_id`      | uuid        | NOT NULL | –                    | FK → `sessions.id` (CASCADE)                             |
| `page_view_id`    | uuid        | nullable | –                    | FK → `page_views.id` (SET NULL)                          |
| `event_name`      | text        | NOT NULL | –                    | e.g. `signup_completed`, `add_to_cart`                   |
| `event_category`  | text        | NOT NULL | `''`                 | Logical grouping                                         |
| `event_action`    | text        | nullable | –                    | Verb                                                     |
| `event_label`     | text        | nullable | –                    | Label / target descriptor                                |
| `event_value`     | numeric     | nullable | –                    | Numeric payload (revenue, quantity, …)                   |
| `target_selector` | text        | nullable | –                    | CSS selector (auto-tracked clicks)                       |
| `target_text`     | text        | nullable | –                    | Truncated inner text of the target                       |
| `target_href`     | text        | nullable | –                    | For anchor clicks                                        |
| `x_position`      | integer     | nullable | –                    | Client X of the click                                    |
| `y_position`      | integer     | nullable | –                    | Client Y of the click                                    |
| `scroll_percent`  | integer     | nullable | –                    | Scroll % at time of event                                |
| `metadata`        | jsonb       | nullable | `'{}'::jsonb`        | Arbitrary user-defined payload                           |
| `occurred_at`     | timestamptz | NOT NULL | `now()`              | Client-supplied when available                           |
| `created_at`      | timestamptz | NOT NULL | `now()`              | Server-side insertion time                               |

### 3.7 `allowed_domains`

| Column         | Type        | Nullable | Default              | Notes                                                    |
|----------------|-------------|----------|----------------------|----------------------------------------------------------|
| `id`           | uuid        | NOT NULL | `gen_random_uuid()`  | PK                                                       |
| `site_id`      | uuid        | NOT NULL | –                    | FK → `sites.id` (CASCADE)                                |
| `domain`       | text        | NOT NULL | –                    | Additional allowed origin, UNIQUE `(site_id, domain)`    |
| `is_verified`  | boolean     | NOT NULL | `false`              | Reserved for future DNS/TXT verification                  |
| `created_at`   | timestamptz | NOT NULL | `now()`              |                                                          |

---

## 4. Enums

| Enum              | Values                                        | Used by                        |
|-------------------|-----------------------------------------------|--------------------------------|
| `site_status`     | `active`, `archived`, `pending`, `suspended`  | `sites.status`                 |
| `api_key_status`  | `active`, `revoked`, `expired`                | `api_keys.status`              |

---

## 5. Indexes (hot paths)

| Table         | Index                          | Rationale                                                  |
|---------------|--------------------------------|------------------------------------------------------------|
| `api_keys`    | `idx_api_keys_key_hash`        | O(log n) lookup during collector API-key validation         |
| `api_keys`    | `idx_api_keys_site`            | Dashboard "list keys per site"                              |
| `sessions`    | `idx_sessions_online`          | RealtimeView WHERE `is_online = true`                       |
| `sessions`    | `idx_sessions_started_at`      | Session list order-by                                       |
| `page_views`  | `idx_page_views_path`          | Top-pages aggregation                                       |
| `events`      | `idx_events_name`              | Top-events aggregation                                      |
| `visitors`    | `idx_visitors_last_seen`       | Active-visitors window                                      |

---

## 6. Row Level Security

- **`service_role`** (used by the collector) bypasses RLS by design.
- **`anon`** and **`authenticated`** roles get **SELECT** on every table (dashboard reads).
- **`anon`** gets **INSERT/UPDATE/DELETE** on `sites`, `api_keys`, and `allowed_domains` because the "Add Website" / "Generate API Key" flows run in the browser via the anon key.
- All other tables (`visitors`, `sessions`, `page_views`, `events`) are **write-locked** to the browser — only the collector (service role) writes.

Tighten these policies in production by scoping to `auth.uid()` once the app introduces authenticated users; the current policies match RC4's public-preview behavior.

---

## 7. Realtime

Publication `supabase_realtime` includes: `visitors`, `sessions`, `page_views`,
`events` with `REPLICA IDENTITY FULL` so payload deltas contain the full old row.
This powers `RealtimeView.tsx` and the live counters on the Dashboard.

---

## 8. Trigger inventory

| Trigger                             | On table    | Behaviour                          |
|-------------------------------------|-------------|------------------------------------|
| `pulse_touch_sites_updated_at`      | `sites`     | BEFORE UPDATE → `NEW.updated_at = now()` |
| `pulse_touch_api_keys_updated_at`   | `api_keys`  | ″                                  |
| `pulse_touch_visitors_updated_at`   | `visitors`  | ″                                  |
| `pulse_touch_sessions_updated_at`   | `sessions`  | ″                                  |

`page_views`, `events`, and `allowed_domains` do not carry an `updated_at`
column and therefore have no trigger.

---

## 9. Running the migration

**Option A — Supabase Dashboard (fastest)**

1. Open Supabase Dashboard → project → **SQL Editor**.
2. Paste the entire contents of `supabase/migrations/001_rc4_complete_schema.sql`.
3. Click **Run**. Idempotent — safe to re-run.

**Option B — Supabase CLI**

```bash
# from /app/MyDashboard
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option C — psql (direct connection)**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/001_rc4_complete_schema.sql
```

Post-run sanity check (also included at the bottom of the SQL file as comments):

```sql
SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='api_keys' ORDER BY ordinal_position;
SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
```

Expected: `key_prefix` present in `api_keys`; `visitors`, `sessions`,
`page_views`, `events` present in the publication list.
