# Pulse Analytics RC4 - Development Setup

## Menjalankan proyek
1. Install dependency:
   - `npm install`
2. Jalankan development server:
   - `npm run dev`
3. Build produksi:
   - `npm run build`
4. Jalankan hasil build:
   - `npm run start`

## Komponen
- Frontend: React + Vite UI dashboard.
- Backend: Express server yang menangani collector API, health check, dan monitoring.
- Collector: Endpoint API untuk menerima tracker data.
- Health: Health endpoints untuk memeriksa status service, Supabase, dan queue.
- Tracker: SDK browser yang mengirim pageview, event, dan heartbeat.
- Monitor: Endpoint `/api/v1/monitor/stats` untuk melihat metrik queue dan collector.

## Port default
- Server Node.js berjalan di port yang ditentukan oleh variable `PORT`.
- Default `.env.example` menunjukkan `PORT=3000`.
- Vite frontend dijalankan pada host `0.0.0.0`, port default Vite biasanya `5173`.

## Konflik port
Jika terjadi konflik port:
- Ubah `PORT` di `.env.local` atau `.env` menjadi port lain, misalnya `3001`.
- Jika Vite tidak bisa dijalankan pada port default, gunakan `npm run dev:client -- --port 5174` atau tetapkan `PORT` lingkungan untuk Vite.
- Alternatif lain: hentikan service lain pada port yang konflik sebelum menjalankan project.

## Catatan running
- `npm run dev` menjalankan `dev:client` (Vite) dan `dev:server` (`tsx server.ts`) secara bersamaan.
- `npm run build` membangun frontend dan membundle server menjadi `dist/server.cjs`.
- `npm run start` hanya menjalankan server terbundle.

## Local development flow
- Frontend: di-compile oleh Vite dan live reload.
- Backend: server Express jalan langsung dari source TypeScript.
- Collector: endpoint API siap menerima request dari tracker.
- Health: tersedia di `/health` dan `/api/health`.
- Tracker: dapat diinisialisasi dari browser menggunakan `collectorUrl` dan `apiKey`.
- Monitor: metrics queue dapat dilihat di `/api/v1/monitor/stats`.
