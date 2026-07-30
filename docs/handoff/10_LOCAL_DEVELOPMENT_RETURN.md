# Pulse Analytics RC4 - Local Development Return

## Tujuan
Project harus dapat dipindahkan kembali ke komputer lokal kapan saja tanpa perubahan source code.

## Target workflow
1. Clone repository
2. `npm install`
3. buat `.env` dari `.env.example`
4. `npm run dev`
5. Frontend berjalan
6. Backend berjalan
7. Collector berjalan
8. Health berjalan
9. Tracker berjalan
10. Dashboard berjalan

## Petunjuk
- Clone repo ke folder lokal.
- Jalankan `npm install` untuk menginstal semua dependency.
- Salin file `.env.example` menjadi `.env` dan isi variabel yang diperlukan.
- Pastikan `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_COLLECTOR_URL` terisi.
- Jalankan `npm run dev` untuk menjalankan Vite frontend dan server Express secara bersamaan.
- Frontend akan tersedia via Vite, sedangkan backend menyediakan collector API.
- Gunakan tracker SDK di website untuk memeriksa bahwa data terkirim ke collector dan disimpan di Supabase.

## Catatan penting
- Tidak ada perubahan source code yang diperlukan untuk kembali ke mode lokal.
- Tidak ada perubahan package.json, env, atau build yang diperlukan.
- Jika deployment sebelumnya menggunakan domain publik, lokal hanya perlu mengarahkan `VITE_COLLECTOR_URL` ke instance lokal.
