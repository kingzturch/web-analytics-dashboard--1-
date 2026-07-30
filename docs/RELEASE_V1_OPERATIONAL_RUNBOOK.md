# PULSE ANALYTICS v1.0 OPERATIONAL RUNBOOK & DISASTER RECOVERY MANUAL

---

## 1. Quick Start Production Deployment

### Option A: Standard Docker Compose Deployment
```bash
# 1. Copy production environment file
cp .env.example .env.production

# 2. Configure credentials in .env.production
# Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Boot container cluster
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verify cluster health
curl http://localhost:3000/health
```

---

## 2. Platform Verification & Smoke Test Checklist

- [x] **Health Check Endpoint**: `GET /health` returns status `200 OK` with system memory, queue depth, and Supabase latency.
- [x] **Collector Endpoint**: `POST /api/v1/collect/pageview` enqueues telemetry with `202 Accepted`.
- [x] **SDK Embed Verification**: `GET /tracker.js` serves minified tracking script with `200 OK`.
- [x] **Platform Monitor**: Dashboard `/api/v1/monitor/stats` updates real-time worker throughput.
- [x] **Offline Queue**: Disconnecting network buffers events in client `IndexedDB` and flushes upon reconnecting.

---

## 3. Disaster Recovery & Troubleshooting

### Scenario 1: Supabase Database Disruption
- **Behavior**: Ingestion queue buffers incoming telemetry up to 10,000 items in memory.
- **Auto-Recovery**: QueueWorker retries failed batch inserts up to 5 times with exponential backoff (5s, 15s, 60s).
- **Manual Action**: Verify database status via Supabase dashboard. Once re-established, the queue drains automatically without dropped events.

### Scenario 2: High Traffic Spike (> 5,000 req/sec)
- **Behavior**: Collector routes immediately return `202 Accepted` and enqueue payloads into `IngestionQueue`.
- **Scaling**: Increase `INGESTION_QUEUE_BATCH_SIZE` to 100 and decrease `INGESTION_QUEUE_FLUSH_MS` to 250 in `.env.production`.
