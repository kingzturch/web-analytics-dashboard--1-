# Pulse Analytics RC4 - Project Overview

## Ringkasan project
Pulse Analytics RC4 adalah platform analytics end-to-end yang menggabungkan tracker SDK, collector API, queue ingestion, Supabase backend, dan dashboard hasil.

## Tujuan platform
- Mengumpulkan data pageview dan event dari situs klien.
- Menyimpan data tersebut di Supabase.
- Menyediakan dashboard analitik real-time dan historical.
- Menyediakan monitoring dan health check untuk collector.
- Menyediakan API key management dan installation manager.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend / Collector API: Node.js + Express + TypeScript
- Data storage: Supabase (PostgreSQL + auth + storage)
- SDK: Tracker library untuk browser
- Queue: in-memory ingestion queue
- Build: Vite build + esbuild bundle server

## Arsitektur
Platform dibangun sebagai satu monorepo dengan:
- Frontend React untuk dashboard dan UI
- Backend Express untuk API collector, health, dan monitoring
- Tracker SDK browser yang memanggil collector API
- Queue service in-memory untuk mem-batch event ingestion ke Supabase
- Supabase sebagai storage utama untuk data analytics dan metadata

## Folder penting
- `src/components/` : UI dashboard, views, modal, layout, shared components
- `src/services/` : logika collector, queue, analytics, auth
- `src/repositories/` : Repository Pattern untuk akses data bisnis
- `src/lib/` : utilitas env, logger, supabase client, tipe data
- `src/sdk/` : Pulse Tracker SDK untuk browser
- `src/lib/supabase/` : adapter Supabase client dan tipe schema
- `public/tracker.js` : script tracker statis yang disajikan ke klien
- `server.ts` : entrypoint Express server dan collector API
- `package.json` : dependency dan skrip build/dev

## Frontend
Frontend deploy menggunakan Vite dan React. UI dashboard menampilkan statistik, laporan, pemantauan platform, dan manajemen situs.

## Backend
Backend adalah Express server yang menyajikan endpoint collector (`/api/v1/collect/*`, `/api/event`, `/api/heartbeat`), health check, versi, dan monitoring queue.

## Tracker SDK
Tracker SDK (`src/sdk/tracker.ts`) bertanggung jawab untuk:
- inisialisasi dengan `apiKey`, `siteId`, `collectorUrl`
- menyimpan `visitorUid` di localStorage dan `sessionUid` di sessionStorage
- mengirim `pageview` ke collector
- mengirim event custom ke collector
- mengirim heartbeat periodik setiap 25 detik

## Collector
Collector API memproses incoming traffic dari tracker:
- validasi API key
- validasi site dan domain
- buat / update visitor
- buat / update session
- simpan page view
- simpan event
- update heartbeat

## Dashboard
Dashboard adalah aplikasi React yang menggunakan Supabase untuk menampilkan data sites, visitors, sessions, page_views, events, dan metric lainnya.

## Repository Pattern
Project menggunakan layer repository untuk memisahkan akses data dari logika bisnis. `src/repositories/` menyimpan abstraksi akses Supabase.

## Service Layer
Service layer berisi logika domain utama:
- `CollectorService` : logika pengolahan tracking payload
- `QueueService` : logika antrian, batch flush, retry, rate limit, audit metrics
- `AnalyticsService` : logika analitik dan query dashboard
- `AuthService` : logika autentikasi dan akses

## Supabase
Supabase adalah database utama dan tempat data analytics disimpan. Integrasi ada di `src/lib/supabase/`.
- client server untuk koleksi data
- tipe row dan insert/update didefinisikan di `types.ts`
- environment Supabase dikonfigurasi melalui `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`

## Queue
Queue ingestion adalah in-memory queue di `src/services/queueService.ts`.
- batch size dikontrol oleh `INGESTION_QUEUE_BATCH_SIZE`
- flush interval dikontrol oleh `INGESTION_QUEUE_FLUSH_MS`
- retry logic dikontrol oleh `INGESTION_QUEUE_MAX_RETRY`
- tujuan: mengurangi jumlah insert langsung ke Supabase dan menyediakan retry

## Monitoring
Monitoring didukung oleh endpoint health dan metrics di server Express:
- `/health`, `/api/health`, `/api/v1/health`
- `/api/v1/version`
- `/api/v1/monitor/stats`
- `/api/health/supabase`

## Build Process
- `npm run build`:
  - `vite build` untuk membangun frontend
  - `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- `npm run start` menjalankan bundle server Node.js di `dist/server.cjs`
- `npm run dev` menjalankan Vite frontend dan server Express secara bersamaan dengan `concurrently`
