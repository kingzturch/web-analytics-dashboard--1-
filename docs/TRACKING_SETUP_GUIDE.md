# Pulse Analytics — Tracking Setup Guide

A step-by-step guide for **end users** to add a website to Pulse Analytics and
verify that data reaches the dashboard.

Prerequisites (one-time, admin):

- The database migration `supabase/migrations/001_rc4_complete_schema.sql` has
  been applied to the Supabase project.
- The dashboard is running at a URL you can reach (locally
  `http://localhost:5173/`, or your deployed URL).
- The collector is reachable at your `VITE_COLLECTOR_URL` value (locally
  `http://localhost:3001/`).

---

## STEP 1 — Open the dashboard

Navigate to the Pulse Analytics dashboard URL in your browser. You will see the
main navigation with **Dashboard**, **Sites**, **Reports**, **Realtime**, etc.

## STEP 2 — Add your website

1. Click **Sites** in the left navigation.
2. Click **Add Website** (top-right).
3. Fill in the fields:
   - **Website name** — a human label (e.g. `My Blog`)
   - **Domain** — the canonical origin **without** protocol, e.g. `example.com`
     (not `https://example.com/`)
   - (optional) **Description**, **Timezone**
4. Click **Create**.

The site is now stored in Supabase (`public.sites` table).

## STEP 3 — Generate an API key

1. From the **Sites** list, click your new site to open its details.
2. Go to the **API Keys** tab.
3. Click **Generate Key**, give it a label (`Production`, `Staging`, …), submit.
4. **Copy the raw API key immediately.** It looks like
   `pa_live_a1b2c3d4e5f6...` and is shown **only once**. Pulse stores the
   SHA-256 hash of the key; if you lose the raw value you must regenerate.

The dashboard has now written:

- one row in `public.api_keys` with `key_hash` and `key_prefix` (the first 12
  characters for identification), and `status = 'active'`.

## STEP 4 — Copy the tracking snippet

Still on your site's page, open the **Tracking** tab. You will see an install
snippet **already personalised with your collector URL and raw API key**:

```html
<script
  src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
  data-api-key="pa_live_YOUR_RAW_API_KEY"
  async>
</script>
```

The collector resolves your `site_id` internally from the API key hash. **The
snippet does NOT contain a `data-site-id` attribute.**

## STEP 5 — Install the tracker on your website

Paste the snippet **once**, right before the closing `</head>` tag of every
page. Framework-specific placements below.

### HTML — plain website

```html
<!doctype html>
<html>
  <head>
    <!-- ... your existing tags ... -->

    <script
      src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
      data-api-key="pa_live_YOUR_RAW_API_KEY"
      async>
    </script>
  </head>
  <body>...</body>
</html>
```

### WordPress — Custom HTML / Header injection

- **Recommended plugin:** *Insert Headers and Footers* (or *Code Snippets*).
- Paste the same `<script>` block into the **"Scripts in Header"** slot.
- Save. It will appear on every page automatically.

### React (Vite / CRA) — `index.html`

Add the `<script>` tag inside the `<head>` of `public/index.html` (CRA) or
`index.html` at the project root (Vite). This ensures the tracker loads before
your React bundle.

```html
<!-- index.html -->
<head>
  <script
    src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
    data-api-key="pa_live_YOUR_RAW_API_KEY"
    async>
  </script>
</head>
```

### Next.js — App Router (`app/layout.tsx`)

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
          data-api-key="pa_live_YOUR_RAW_API_KEY"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

### Next.js — Pages Router (`pages/_document.tsx`)

```tsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script
            src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
            data-api-key="pa_live_YOUR_RAW_API_KEY"
            async
          />
        </Head>
        <body><Main /><NextScript /></body>
      </Html>
    );
  }
}
```

### Vue 3 (Vite)

Add the `<script>` in `index.html` `<head>`, or dynamically in the app root:

```html
<!-- index.html -->
<head>
  <script
    src="https://YOUR-COLLECTOR-DOMAIN/tracker.js"
    data-api-key="pa_live_YOUR_RAW_API_KEY"
    async>
  </script>
</head>
```

### Laravel Blade

`resources/views/layouts/app.blade.php`:

```blade
<head>
  <script
    src="{{ config('services.pulse.collector_url') }}/tracker.js"
    data-api-key="{{ config('services.pulse.api_key') }}"
    async>
  </script>
</head>
```

`config/services.php`:

```php
'pulse' => [
    'collector_url' => env('PULSE_COLLECTOR_URL'),
    'api_key'       => env('PULSE_API_KEY'),
],
```

## STEP 6 — Verify Installation

1. Back in the Pulse dashboard, go to **Sites** → your site → **Integration
   Verification**.
2. Click **Verify Installation** (or **Test Connection**).
3. The dashboard will fire a live `pageview`, `event`, and `heartbeat` against
   the collector using your raw API key. All three must return HTTP 200 /
   `{"success": true, ...}`.
4. The **9-item checklist** must turn green:
   - ✔ createSite
   - ✔ generateApiKey
   - ✔ trackerLoaded
   - ✔ firstPageView
   - ✔ firstVisitor
   - ✔ firstSession
   - ✔ heartbeatReceived
   - ✔ firstEvent
   - ✔ dashboardUpdate

If any item stays red, see the **Troubleshooting** section of
`docs/handoff/LOCAL_SETUP_GUIDE.md` §9.

## STEP 7 — Watch data flow in

Open your website in a fresh browser tab, then return to the dashboard:

- **Dashboard tab** — Visitors / Sessions / Page Views counters increment.
- **Realtime tab** — your visitor appears with the current URL and country
  within ~10 s.
- **Reports → Top Pages** — the URL you just loaded shows up.
- **Events tab** — any custom `pulse.track('event_name', {...})` calls appear.

Congratulations — your website is now tracked.

---

## Custom events (optional)

Once the tracker is loaded, it exposes a global `window.pulse` API:

```html
<script>
  document.querySelector('#signup').addEventListener('click', () => {
    window.pulse.track('signup_started', { source: 'hero' });
  });

  // Purchase example with monetary value
  window.pulse.track('purchase', { value: 49.90, currency: 'USD', plan: 'pro' });
</script>
```

`event_name` is required; the second argument becomes the `metadata` JSONB
column in `public.events`.

---

## Common gotchas

| Symptom | Likely cause | Fix |
|---|---|---|
| Nothing appears in the dashboard | Snippet not on the page | View source of the target website and search for `tracker.js` |
| Console: `Origin '...' is not allowed` | Your `ALLOWED_ORIGINS` doesn't include the site's origin | Either widen `ALLOWED_ORIGINS` in `.env.local` or add the domain to `public.allowed_domains` for the site |
| Console: `Invalid, revoked, or expired API Key` | Wrong `data-api-key` value on the tag | Re-copy the raw key from Sites → API Keys. If it's lost, regenerate. |
| Realtime tab is empty | Realtime publication does not include the tables | Rerun `supabase/migrations/001_rc4_complete_schema.sql` — its section §12 is idempotent and will enroll the 4 event tables |
| CORS errors from browser DevTools | The website's origin isn't in `ALLOWED_ORIGINS` on the collector | Update `.env.local` and restart the collector (`npm run dev`) |

---

## Removing a website

Delete the site row from **Sites** → row actions → **Delete**. This cascades
and removes all `api_keys`, `visitors`, `sessions`, `page_views`, `events`, and
`allowed_domains` associated with that site. **This is irreversible.**
