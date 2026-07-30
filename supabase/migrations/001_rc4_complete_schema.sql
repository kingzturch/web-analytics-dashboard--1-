-- =============================================================================
-- Pulse Analytics RC4 — Complete Schema Migration
-- File: supabase/migrations/001_rc4_complete_schema.sql
-- Purpose: single source-of-truth schema aligned with src/lib/supabase/types.ts
--
-- Design rules:
--   * Idempotent — safe on fresh DBs AND on existing partial RC4 databases
--   * Uses IF NOT EXISTS everywhere possible
--   * NEVER drops columns, tables, indexes, or constraints
--   * NEVER truncates data
--   * PostgreSQL 15+ compatible (Supabase default)
--   * Requires Supabase service role (or db owner) to run
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0.  Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- 1.  Enum types  (idempotent via exception block; CREATE TYPE lacks IF NOT EXISTS pre-PG15)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_status') THEN
    CREATE TYPE public.site_status AS ENUM ('active', 'archived', 'pending', 'suspended');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_key_status') THEN
    CREATE TYPE public.api_key_status AS ENUM ('active', 'revoked', 'expired');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2.  sites
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  domain       text NOT NULL UNIQUE,
  description  text,
  timezone     text NOT NULL DEFAULT 'UTC',
  status       public.site_status NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3.  api_keys
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_prefix    text,
  key_hash      text NOT NULL UNIQUE,
  status        public.api_key_status NOT NULL DEFAULT 'active',
  expires_at    timestamptz,
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Bring existing DBs up to spec (adds key_prefix if it was created without it)
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_prefix text;

-- -----------------------------------------------------------------------------
-- 4.  visitors
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visitors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  visitor_uid       text NOT NULL,
  identified_user   text,
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  total_sessions    integer NOT NULL DEFAULT 0,
  total_page_views  integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitors_site_visitor_uid_uq UNIQUE (site_id, visitor_uid)
);

-- -----------------------------------------------------------------------------
-- 5.  sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  visitor_id        uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  session_uid       text NOT NULL UNIQUE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  duration_seconds  integer NOT NULL DEFAULT 0,
  landing_page      text NOT NULL DEFAULT '',
  exit_page         text NOT NULL DEFAULT '',
  page_count        integer NOT NULL DEFAULT 0,
  referrer          text,
  country           text NOT NULL DEFAULT '',
  country_code      text NOT NULL DEFAULT '',
  device_type       text NOT NULL DEFAULT '',
  browser           text NOT NULL DEFAULT '',
  operating_system  text NOT NULL DEFAULT '',
  is_online         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Bring existing DBs up to spec (RC4 code writes these two timestamps)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- -----------------------------------------------------------------------------
-- 6.  page_views
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  visitor_id        uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  session_id        uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  page_order        integer NOT NULL,
  url               text NOT NULL,
  path              text NOT NULL,
  query_string      text,
  hash_fragment     text,
  title             text NOT NULL DEFAULT '',
  referrer          text,
  entered_at        timestamptz NOT NULL DEFAULT now(),
  left_at           timestamptz,
  duration_seconds  integer,
  scroll_depth      integer,
  is_exit_page      boolean NOT NULL DEFAULT false
);

-- -----------------------------------------------------------------------------
-- 7.  events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  visitor_id       uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  session_id       uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  page_view_id     uuid REFERENCES public.page_views(id) ON DELETE SET NULL,
  event_name       text NOT NULL,
  event_category   text NOT NULL DEFAULT '',
  event_action     text,
  event_label      text,
  event_value      numeric,
  target_selector  text,
  target_text      text,
  target_href      text,
  x_position       integer,
  y_position       integer,
  scroll_percent   integer,
  metadata         jsonb DEFAULT '{}'::jsonb,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Bring existing DBs up to spec
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- -----------------------------------------------------------------------------
-- 8.  allowed_domains
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allowed_domains (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  domain       text NOT NULL,
  is_verified  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT allowed_domains_site_domain_uq UNIQUE (site_id, domain)
);

-- -----------------------------------------------------------------------------
-- 9.  Indexes  (hot paths used by collectorService and dashboard reads)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_api_keys_site         ON public.api_keys (site_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status       ON public.api_keys (status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash     ON public.api_keys (key_hash);

CREATE INDEX IF NOT EXISTS idx_visitors_site         ON public.visitors (site_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen    ON public.visitors (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_first_seen   ON public.visitors (first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_site         ON public.sessions (site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor      ON public.sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at   ON public.sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_online       ON public.sessions (site_id, is_online, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_site       ON public.page_views (site_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session    ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_entered    ON public.page_views (entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON public.page_views (site_id, path);

CREATE INDEX IF NOT EXISTS idx_events_site           ON public.events (site_id);
CREATE INDEX IF NOT EXISTS idx_events_session        ON public.events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_name           ON public.events (site_id, event_name);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at    ON public.events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_allowed_domains_site  ON public.allowed_domains (site_id);

-- -----------------------------------------------------------------------------
-- 10. updated_at auto-touch trigger  (kept minimal, DRY)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pulse_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sites','api_keys','visitors','sessions']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = format('pulse_touch_%s_updated_at', t)
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER pulse_touch_%1$s_updated_at
           BEFORE UPDATE ON public.%1$I
           FOR EACH ROW EXECUTE FUNCTION public.pulse_touch_updated_at();',
        t
      );
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 11. Row Level Security  (RLS ready — collector uses service_role which bypasses RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.sites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_domains  ENABLE ROW LEVEL SECURITY;

-- Anon read-only policies for the browser dashboard (safe: anon key is public-by-design)
-- The service_role automatically bypasses RLS so collector inserts continue to work.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sites','api_keys','visitors','sessions','page_views','events','allowed_domains'
  ]
  LOOP
    -- SELECT for anon
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='anon_select_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY anon_select_all ON public.%I FOR SELECT TO anon USING (true);', t
      );
    END IF;

    -- SELECT for authenticated (dashboard when logged-in)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='authenticated_select_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY authenticated_select_all ON public.%I FOR SELECT TO authenticated USING (true);', t
      );
    END IF;
  END LOOP;
END $$;

-- Anon insert/update policies ONLY on tables the dashboard writes directly to
-- (sites and api_keys — from the "Add Website" / "Generate API Key" UI in the browser).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sites' AND policyname='anon_write_sites') THEN
    CREATE POLICY anon_write_sites ON public.sites
      FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_keys' AND policyname='anon_write_api_keys') THEN
    CREATE POLICY anon_write_api_keys ON public.api_keys
      FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='allowed_domains' AND policyname='anon_write_allowed_domains') THEN
    CREATE POLICY anon_write_allowed_domains ON public.allowed_domains
      FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 12. Realtime replication  (RealtimeView + dashboard live counters)
-- -----------------------------------------------------------------------------
-- Set REPLICA IDENTITY FULL so UPDATE deltas carry the full old row (needed by
-- Realtime for change payloads). Safe on empty tables.
ALTER TABLE public.visitors    REPLICA IDENTITY FULL;
ALTER TABLE public.sessions    REPLICA IDENTITY FULL;
ALTER TABLE public.page_views  REPLICA IDENTITY FULL;
ALTER TABLE public.events      REPLICA IDENTITY FULL;

-- Enroll into the Supabase realtime publication if not already there.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Fresh DB without Supabase-managed publication yet — create ours
    CREATE PUBLICATION supabase_realtime FOR TABLE
      public.visitors, public.sessions, public.page_views, public.events;
  ELSE
    -- Existing publication — ADD each table if not already published
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='visitors') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='sessions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='page_views') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='events') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Post-migration verification queries (run manually — not part of the migration)
-- =============================================================================
--   SELECT column_name FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='api_keys' ORDER BY ordinal_position;
--
--   SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
--
--   SELECT schemaname, tablename, policyname, roles
--     FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
-- =============================================================================
