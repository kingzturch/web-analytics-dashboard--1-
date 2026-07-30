# RC4 Development Integration Report

## 1. Perubahan File

- `package.json`
  - Menambahkan `dev`, `dev:client`, dan `dev:server`.
  - Menambahkan dev dependency `concurrently`.
- `package-lock.json`
  - Diupdate oleh `npm install` untuk dependency `concurrently`.
- `vite.config.ts`
  - Frontend dev server diarahkan ke port `5173` dengan `strictPort`.
  - Proxy `/api`, `/health`, dan `/tracker.js` membaca `VITE_COLLECTOR_URL` dari env.
  - Tidak ada fallback hardcoded collector URL.
- `server.ts`
  - Backend dev tidak lagi memuat embedded Vite secara default.
  - Catch-all static route diperbaiki untuk Express 5 dengan `/.*/`.
- `src/components/TrackingInstallationView.tsx`
  - Snippet tracking tidak lagi meminta `data-site-id`.
  - Test Connection mengirim request nyata ke pageview, event, dan heartbeat collector endpoint.
  - Test Connection tidak lagi mengirim `site_id`; collector resolve site dari raw API key.
- `public/tracker.js`
  - Payload tracker tidak lagi mengirim `siteId`.
- `src/sdk/tracker.ts`
  - Payload SDK tidak lagi mengirim `siteId`; option lama tetap ada untuk backward compatibility tipe init.
- `src/services/analyticsService.ts`
  - Integration status menambahkan visitor count dan checklist verification berbasis data Supabase.
- `src/components/IntegrationVerificationView.tsx`
  - Checklist existing diperluas menjadi verifikasi install pertama tanpa menambah menu/page baru.

## 2. Development Environment

- `npm run dev` sekarang menjalankan frontend Vite dan backend collector bersamaan via `concurrently`.
- `npm run dev:client` menjalankan Vite di port `5173`.
- `npm run dev:server` menjalankan collector Express di port dari env, saat ini `3000`.
- Production build script tidak diubah.

## 3. Frontend Verification

- Vite config menggunakan `port: 5173` dan `strictPort: true`.
- Runtime verification:
  - `http://127.0.0.1:5173` mengembalikan HTML Pulse Analytics dengan title `Analytics Dashboard`.
  - `http://localhost:5173` saat audit masih mengarah ke proses lain di IPv6 `::1` dengan title `AnalyticsHub Dashboard`.
- Kesimpulan: frontend Pulse berjalan di port 5173 IPv4, tetapi akses persis `localhost:5173` terblokir proses lain di mesin lokal.

## 4. Backend Verification

- `npm run dev:server` berhasil start collector.
- `http://localhost:3000/api/v1/health` mengembalikan HTTP `200`.
- Embedded Vite tidak lagi dimuat default oleh backend, sehingga collector dapat berjalan sebagai backend terpisah.

## 5. Collector Verification

- Endpoint yang dipakai Test Connection:
  - `POST /api/v1/collect/pageview`
  - `POST /api/v1/collect/event`
  - `POST /api/v1/collect/heartbeat`
- Success hanya diterima jika collector mengembalikan HTTP `200` atau `202` dan response success valid.
- Error collector diteruskan ke UI sebagai penyebab sebenarnya.

## 6. Supabase Verification

- Frontend tetap memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Backend tetap memakai `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
- Tidak ada schema, migration, table, column, atau FK yang diubah.
- Integration Verification tetap mengambil data melalui Service Layer dan Repository.

## 7. Tracker Verification

- Snippet memakai `VITE_COLLECTOR_URL` sebagai base URL collector.
- Snippet memakai raw API key melalui `data-api-key`.
- Snippet tidak lagi memakai `data-site-id`.
- `public/tracker.js` tidak lagi mengirim `siteId`; collector menentukan site melalui API key.
- TypeScript SDK payload juga tidak lagi mengirim `siteId`.

## 8. End-to-End Flow Verification

Expected flow setelah perubahan:

1. Create Site melalui flow existing.
2. Generate API Key melalui API Keys tab.
3. Copy Tracking Snippet dari Sites -> Tracking.
4. Paste snippet ke website asli.
5. `tracker.js` load dari collector URL.
6. Collector menerima pageview/event/heartbeat.
7. Collector resolve API key ke `site_id`.
8. Collector insert visitor, session, page_view, dan event ke Supabase.
9. Dashboard/Realtime/Integration Verification membaca data dari Supabase melalui repository/service existing.

Runtime yang sudah diverifikasi:

- Backend collector health: PASS.
- Frontend Pulse di `127.0.0.1:5173`: PASS.
- `localhost:5173`: BLOCKED oleh proses lain di IPv6 `::1`.

## 9. Manual Testing Checklist

- Stop proses lain yang sedang memakai `::1:5173` jika ingin akses persis `http://localhost:5173`.
- Jalankan `npm run dev`.
- Buka `http://localhost:5173` atau `http://127.0.0.1:5173`.
- Pastikan `http://localhost:3000/api/v1/health` HTTP `200`.
- Buat site asli.
- Generate raw API key.
- Paste raw API key ke Sites -> Tracking.
- Copy snippet dan pasang pada website asli.
- Buka website asli dan tunggu pageview pertama.
- Klik Test Connection hanya dengan raw API key valid.
- Buka Integration Verification dan cek status tracker, pageview, visitor, session, heartbeat, event.

## 10. Remaining Risks

- Ada proses project lain yang bind `::1:5173`, sehingga `localhost:5173` dapat mengarah ke app lain meski Pulse berjalan di `127.0.0.1:5173`.
- Build Vite masih memberi warning chunk lebih besar dari 500 kB. Ini tidak memblokir build, tapi bisa menjadi task performance berikutnya.
- Test Connection menghasilkan telemetry diagnostik nyata di Supabase karena memang mengirim request collector sungguhan.