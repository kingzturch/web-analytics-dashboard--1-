# Pulse Analytics RC4 - Known Limitations

## Keterbatasan umum
- `localhost` conflict: port default backend `PORT=3000` dan port Vite default `5173` dapat konflik dengan service lain.
- Bundle size: frontend React/Vite dapat menghasilkan bundle besar jika banyak dependensi ditambahkan.
- Environment: konfigurasi environment sensitif, khususnya `SUPABASE_SERVICE_ROLE_KEY` harus disimpan aman.
- Deployment: queue in-memory tidak persisten, sehingga restart service dapat menyebabkan data queue hilang.
- Tracker: SDK hanya mendukung browser dan tidak memiliki fallback server-side rendering khusus.
- CORS: konfigurasi `ALLOWED_ORIGINS` perlu benar agar dashboard dan tracker dapat mengakses collector.

## Keterbatasan teknis
- Queue service berjalan di-memory, bukan external worker. Ini rentan terhadap restart proses.
- API key validation memuat semua key dari tabel `api_keys` lalu melakukan pencocokan di aplikasi.
- Validasi domain dan allowed origins sangat tergantung konfigurasi `ALLOWED_ORIGINS` dan tabel domain jika `database`.
- Health check hanya memberikan overview dasar dan tidak memeriksa semua dependency internal.

## Keterbatasan pengembangan
- Tidak ada refactor besar atau perubahan arsitektur yang disarankan saat ini.
- Perubahan integrasi nyata hanya pada deployment dan konfigurasi domain/SSL.
- Penanganan retry queue sederhana dan tidak mendukung persistent backoff state.

## Rekomendasi mitigasi
- Gunakan port khusus jika terjadi konflik.
- Pastikan SSL dan CORS dikonfigurasi dengan benar.
- Perhatikan bahwa queue in-memory bisa kehilangan data selama restart.
- Gunakan alat monitoring tambahan jika dibutuhkan produksi skala besar.
