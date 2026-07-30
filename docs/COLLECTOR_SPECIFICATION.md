# PULSE ANALYTICS - PHASE 2: COLLECTOR PLATFORM & TRACKING SDK SPECIFICATION
**Production Grade v1.0**

---

## 1. ENDPOINT SPECIFICATION
All collector platform endpoints use versioned routing under `/api/v1/`.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/collect/pageview` | Records a new page view, updates visitor & session stats. | API Key (`x-api-key` or payload `apiKey`) |
| `POST` | `/api/v1/collect/event` | Records custom events, interactions, or Web Vitals in `events.metadata`. | API Key (`x-api-key` or payload `apiKey`) |
| `POST` | `/api/v1/collect/heartbeat` | Updates session duration, active status, and online indicator. | API Key (`x-api-key` or payload `apiKey`) |
| `GET` | `/api/v1/health` | Collector health & system readiness check. | None |
| `GET` | `/api/v1/version` | Returns Collector API version (`1.0.0`) and runtime state. | None |
| `GET` | `/tracker.js` | Standalone client tracking JavaScript library script. | None |

---

## 2. PAYLOAD SPECIFICATION

### A. Page View Payload (`POST /api/v1/collect/pageview`)
Note: `siteId` is omitted from the request payload; the site ID is derived exclusively from the API Key lookup.

```json
{
  "apiKey": "pa_live_sec_...",
  "visitorUid": "vis_9x8f7a6b5c4d",
  "sessionUid": "ses_1a2b3c4d5e6f",
  "url": "https://example.com/checkout",
  "path": "/checkout",
  "title": "Checkout Page - Store",
  "referrer": "https://google.com",
  "language": "en-US",
  "timezone": "Asia/Jakarta",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "browser": "Chrome",
  "browserVersion": "125.0",
  "operatingSystem": "Windows",
  "operatingSystemVersion": "11",
  "country": "Indonesia",
  "countryCode": "ID",
  "deviceType": "desktop",
  "enteredAt": "2026-07-29T09:30:00.000Z"
}
```

### B. Event Payload (`POST /api/v1/collect/event`)
```json
{
  "apiKey": "pa_live_sec_...",
  "visitorUid": "vis_9x8f7a6b5c4d",
  "sessionUid": "ses_1a2b3c4d5e6f",
  "pageViewId": "pv_12345678",
  "eventName": "button_click",
  "eventCategory": "engagement",
  "eventAction": "click",
  "eventLabel": "Buy Now Button",
  "eventValue": 100,
  "targetSelector": "#buy-now-btn",
  "targetText": "Buy Now",
  "targetHref": "/checkout",
  "xPosition": 450,
  "yPosition": 620,
  "scrollPercent": 75,
  "metadata": {
    "webVitals": {
      "LCP": 1200,
      "FID": 12,
      "CLS": 0.02
    }
  }
}
```

### C. Heartbeat Payload (`POST /api/v1/collect/heartbeat`)
```json
{
  "apiKey": "pa_live_sec_...",
  "visitorUid": "vis_9x8f7a6b5c4d",
  "sessionUid": "ses_1a2b3c4d5e6f",
  "timestamp": "2026-07-29T09:30:30.000Z"
}
```

---

## 3. VALIDATION RULES
1. **API Key Authentication**:
   - `apiKey` must be provided via `x-api-key` HTTP header or body property.
   - Hash of provided key (`SHA-256`) is looked up against `api_keys.key_hash`.
   - Key status must be `'active'`, and `expires_at` must not be in the past.
   - Site ID is derived strictly from the matched key record.
2. **Domain Validation**:
   - Request `Origin` or `Referer` or payload `url` domain is extracted and normalized.
   - Must match `sites.domain` or subdomains thereof (localhost/Cloud Run environments permitted for testing).
3. **Required Fields**:
   - Pageview: `url` must be a valid URI string.
   - Event: `eventName` must be a non-empty string.
   - Heartbeat: `sessionUid` & `visitorUid` required.

---

## 4. API RESPONSE FORMAT
All responses follow a standard JSON envelope structure:

### Success Response (`200 OK`)
```json
{
  "success": true,
  "site_id": "site_98765432",
  "visitor_uid": "vis_9x8f7a6b5c4d",
  "session_uid": "ses_1a2b3c4d5e6f",
  "recorded_at": "2026-07-29T09:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Unauthorized",
  "details": "Invalid, revoked, or expired API Key.",
  "statusCode": 401
}
```

---

## 5. ERROR CODE LIST

| Code | Status Name | Description |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing required parameters (e.g. `url` or `eventName`). |
| `401` | Unauthorized | Missing, invalid, expired, or revoked API Key. |
| `403` | Forbidden | Request domain/origin does not match registered site domain or site suspended. |
| `404` | Not Found | Registered site ID not found in Supabase database. |
| `422` | Unprocessable Entity | Payload validation failure or invalid data types. |
| `429` | Too Many Requests | Rate limit exceeded. |
| `500` | Internal Server Error | Supabase database connection error or server crash. |

---

## 6. SDK ARCHITECTURE (`tracker.js` / `tracker.ts`)
- **Initialization**: Auto-boots upon DOM load. Reads `data-api-key` and `data-host` attributes from the script element.
- **Identity Storage**: `visitor_uid` stored in `localStorage` (`_pulse_vid`), `session_uid` stored in `sessionStorage` (`_pulse_sid`).
- **Auto-tracking Capabilities**:
  - SPA Navigation (`popstate`, history `pushState` / `replaceState` patches).
  - Web Vitals capture (LCP, FID, CLS) emitted into custom event metadata.
  - Heartbeat timer (fires every 25 seconds).
  - Beacon queue: Uses `navigator.sendBeacon` upon `visibilitychange` / `pagehide`.
  - Retry Queue: Retries failed network requests with exponential backoff up to 3 attempts.

---

## 7. COLLECTOR ARCHITECTURE
```
[Client Website / SDK]
        │
   HTTP POST Request (JSON / Beacon)
        │
        ▼
[Express Server Router /api/v1/*]
        │
        ▼
[Validation Layer] ── (Validate API Key Hash & Domain Match)
        │
        ▼
[Collector Service] ── (Get/Create Visitor & Session, calculate metrics)
        │
        ▼
[Site & Analytics Repositories]
        │
        ▼
[Supabase PostgreSQL Database]
```

---

## 8. REPOSITORY MAPPING
- **`SiteRepository`**: Manages `sites` and `api_keys` records (querying key hashes, updating `last_used_at`).
- **`AnalyticsRepository`**: Aggregates time-series, page views, bounce rate, visitor cohorts, and breakdown statistics directly via SQL/Supabase filters.

---

## 9. SERVICE MAPPING
- **`CollectorService`**: Handles ingestion logic (`processCollect`, `processEvent`, `processHeartbeat`).
- **`AnalyticsService`**: Reads aggregated analytics metrics for the dashboard.
- **`AuthService`**: Manages user authentication and session credentials.

---

## 10. SECURITY CHECKLIST
- [x] Service Role Key restricted to server-side Node environment (`server.ts`).
- [x] Raw secret keys displayed ONCE upon creation; only SHA-256 hashes stored in database.
- [x] API Key secret lookup uses hashed comparison (`key_hash`).
- [x] Request Origin and Host validation against registered `sites.domain`.
- [x] Rate limiting middleware applied on Express collector routes.

---

## 11. FLOW DIAGRAM
```
[Visitor Opens Page] ──► [SDK initializes visitorUid & sessionUid]
                             │
                             ▼
                     [Send POST /api/v1/collect/pageview]
                             │
                             ▼
                     [Collector verifies API Key & Domain]
                             │
                             ▼
               [Upsert Visitor] ──► [Upsert Session] ──► [Insert Page View]
                             │
                             ▼
               [Background Heartbeat every 25s updates session.duration_seconds & is_online]
```

---

## 12. WEBSITE INSTALLATION FLOW
1. User creates or selects a Site in the Sites tab.
2. User generates a new API Key (Raw key `pa_live_sec_...` displayed ONCE in UI modal).
3. User chooses target framework (HTML, React, Next.js, Vue, Nuxt, Svelte, Astro, Laravel, WordPress, Remix).
4. User pastes the script tag or component import into their application.
5. User clicks "Test Connection" button to send a live test packet and verify status.

---

## 13. DIAGNOSTICS FLOW
1. Site Diagnostics view fetches Collector health (`GET /api/v1/health`), API key status, and latest telemetry entries.
2. Calculates current response latency (ms) and error count.
3. Displays last request, last event, and last pageview timestamps for active site.

---

## 14. WEBSITE HEALTH FLOW
1. Website Health Monitor lists all registered websites.
2. Checks latest session activity timestamp:
   - Active within 3 mins: **Online** (Green badge).
   - Active within 24 hours: **Idle** (Yellow badge).
   - Inactive > 24 hours or no data: **Warning / Offline** (Red badge).
3. Provides one-click navigation to site setup or diagnostic tools.
