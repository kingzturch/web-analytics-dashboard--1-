# PULSE ANALYTICS VERSION MANIFEST v1.0.0 (RELEASE CANDIDATE)

```json
{
  "platform": "Pulse Analytics",
  "version": "1.0.0",
  "releaseDate": "2026-07-29",
  "status": "Release Candidate 1 (RC1)",
  "components": {
    "dashboard": {
      "version": "1.0.0",
      "framework": "React 18 + Vite + Tailwind CSS",
      "status": "Production Ready"
    },
    "collectorApi": {
      "version": "1.0.0-RC1",
      "framework": "Express Node.js TypeScript",
      "status": "Production Ready",
      "endpoints": [
        "/api/v1/collect/pageview",
        "/api/v1/collect/event",
        "/api/v1/collect/heartbeat",
        "/health",
        "/api/v1/monitor/stats"
      ]
    },
    "trackerSdk": {
      "version": "1.0.0",
      "file": "/public/tracker.js",
      "size": "5.8 KB (uncompressed)",
      "capabilities": [
        "SPA Routing",
        "Core Web Vitals",
        "IndexedDB Offline Queue",
        "Adaptive Heartbeat",
        "Beacon Transport"
      ]
    },
    "ingestionQueue": {
      "version": "1.0.0",
      "batchSize": 50,
      "flushIntervalMs": 500,
      "maxRetries": 5
    },
    "database": {
      "provider": "Supabase PostgreSQL",
      "tables": ["sites", "api_keys", "visitors", "sessions", "page_views", "events"]
    }
  }
}
```
