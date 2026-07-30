# Pulse Analytics RC4 - Deployment

## Deployment production
Platform ini dapat di-deploy sebagai satu service Node.js yang melayani frontend statis dan API collector.

## Dashboard
- Dashboard React dibangun menjadi aset statis oleh `vite build`.
- Aset statis ditempatkan dalam `dist` dan dilayani oleh Express pada production.
- Pastikan `NODE_ENV=production` saat build dan menjalankan server.

## Collector
- Collector API adalah endpoint Express dalam `server.ts`.
- Endpoint penting:
  - `/tracker.js` : script tracker statis
  - `/api/v1/collect/pageview`
  - `/api/collect`
  - `/api/v1/collect/event`
  - `/api/event`
  - `/api/v1/collect/heartbeat`
  - `/api/heartbeat`

## Supabase
- Supabase menjadi penyimpanan data utama.
- Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dikonfigurasi.
- Supabase menyimpan tabel untuk sites, api_keys, visitors, sessions, page_views, events, dan data analitik lainnya.

## Environment
- Gunakan environment variabel yang benar untuk produksi.
- Jangan commit secret keys.
- Pastikan `ALLOWED_ORIGINS` berisi origin dashboard dan collector yang sah.
- Atur `VITE_COLLECTOR_URL` ke URL publik collector service.

## Domain
- Deploy collector dan dashboard ke domain yang valid.
- `VITE_COLLECTOR_URL` harus mencerminkan domain publik collector.
- Domain dashboard dapat mengakses collector selama CORS valid.

## SSL
- Pastikan semua traffic ke dashboard, collector, dan Supabase menggunakan HTTPS.
- SSL harus diaktifkan pada domain publik.
- Jika host di platform managed, pasang sertifikat SSL untuk domain.

## CORS
- `ALLOWED_ORIGINS` mengatur CORS server Express.
- Jika menggunakan value `database`, kontrol domain akan diambil dari Supabase allowed domains tabel untuk setiap site.
- Jika menggunakan daftar origin string, pisahkan dengan koma.

## Health Check
- Health endpoints:
  - `/health`
  - `/api/health`
  - `/api/v1/health`
  - `/api/health/supabase`
- Gunakan endpoint ini untuk memverifikasi service online dan koneksi Supabase.

## Queue
- System queue berjalan di-memory di `src/services/queueService.ts`.
- Pastikan environment queue diatur:
  - `INGESTION_QUEUE_BATCH_SIZE`
  - `INGESTION_QUEUE_FLUSH_MS`
  - `INGESTION_QUEUE_MAX_RETRIES`
- Perhatikan bahwa queue in-memory tidak persisten jika process restart; ini berarti deployment perlu meminimalkan restart dan memonitor antrian.
