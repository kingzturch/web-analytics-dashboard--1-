# Pulse Analytics RC4 - Environment Variables

Dokumentasi environment variable yang digunakan oleh platform.

## Frontend
- `VITE_SUPABASE_URL`
  - URL publik Supabase project.
  - Digunakan oleh frontend untuk menghubungkan dashboard dan mungkin auth client.
- `VITE_SUPABASE_ANON_KEY`
  - Anonymous public key Supabase untuk akses client-side.
  - Digunakan oleh frontend untuk inisialisasi Supabase pada browser.
- `VITE_COLLECTOR_URL`
  - URL publik collector API.
  - Digunakan oleh tracker SDK dan tracker script untuk mengirim data pageview/event/heartbeat.

## Backend
- `SUPABASE_URL`
  - URL Supabase project backend.
  - Digunakan oleh server untuk membuat client Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`
  - Service role key Supabase yang memiliki izin baca/tulis penuh.
  - Digunakan oleh backend untuk melakukan operasi database yang aman.
- `PORT`
  - Port tempat server Express berjalan.
  - Contoh: `3000`.
- `NODE_ENV`
  - Mode environment Node.js.
  - Contoh: `production`, `development`.

## Queue
- `INGESTION_QUEUE_BATCH_SIZE`
  - Ukuran batch event yang diproses per flush.
  - Digunakan oleh queue worker untuk menentukan berapa banyak event yang dikirim ke Supabase sekaligus.
- `INGESTION_QUEUE_FLUSH_MS`
  - Interval flush queue dalam milidetik.
  - Queue worker memproses batch secara periodik berdasarkan nilai ini.
- `INGESTION_QUEUE_MAX_RETRIES`
  - Jumlah maksimal retry jika batch insert gagal.
  - Jika retry tercapai, event akan dibuang.

## Security
- `RATE_LIMIT_IP_PER_MIN`
  - Batas permintaan per IP per menit.
  - Digunakan untuk mencegah abuse langsung ke collector API.
- `RATE_LIMIT_KEY_PER_MIN`
  - Batas permintaan per API key per menit.
  - Digunakan untuk mencegah penyalahgunaan key.
- `ALLOWED_ORIGINS`
  - Daftar origin yang diizinkan dipisah koma, atau nilai `database`.
  - Digunakan untuk kontrol CORS dan validasi domain collector.

## Version
- `PULSE_SDK_VERSION`
  - Versi tracker SDK Pulse.
  - Digunakan untuk metadata versi dan monitoring.
- `PULSE_COLLECTOR_VERSION`
  - Versi collector API.
  - Digunakan oleh health endpoints dan monitoring.

## Catatan khusus
- `ALLOWED_ORIGINS` dapat berisi `database` untuk membiarkan validasi domain dilakukan oleh data site yang tersimpan di Supabase.
- Jangan menyimpan rahasia seperti `SUPABASE_SERVICE_ROLE_KEY` di repositori.
- Frontend `VITE_` variable hanya tersedia di browser saat build dari Vite.
