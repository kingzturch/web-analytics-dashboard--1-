# Pulse Analytics RC4 - Migration to Emergent

## Tujuan migrasi
Project ini akan dipindahkan ke Emergent dengan tetap mempertahankan arsitektur dan komponen utama.

## Emergent HARUS mempertahankan
- ✔ seluruh arsitektur
- ✔ schema Supabase
- ✔ Repository Pattern
- ✔ Service Layer
- ✔ Dashboard
- ✔ Collector
- ✔ Tracking SDK
- ✔ Queue
- ✔ Platform Monitor
- ✔ Installation Manager
- ✔ seluruh endpoint API

## Emergent DILARANG
- ❌ membuat schema baru
- ❌ mengubah schema
- ❌ mengganti arsitektur
- ❌ mengganti Supabase
- ❌ mengganti Repository Pattern
- ❌ membuat dashboard baru
- ❌ memecah ulang menu
- ❌ mengubah flow tracking
- ❌ menghapus collector
- ❌ menghapus SDK

## Pengamatan penting
- Migrasi harus fokus pada transfer ke Emergent tanpa perubahan desain data dan API.
- Semua endpoint collector dan dashboard harus tetap kompatibel dengan tracker yang sudah ada.
- Supabase tetap menjadi storage utama; tidak ada penggantian database.
- Repository dan Service Layer harus tetap ada sebagai lapisan arsitektur utama.

## Handoff ke Emergent
- Dokumen ini adalah pedoman bahwa Emergent hanya boleh mengadaptasi platform, bukan merombak.
- Seluruh proses tracking, penyimpanan, dan dashboard harus dapat berjalan kembali tanpa mengganti schema atau arsitektur.
- Jika ada tambahan fitur, harus dilakukan dalam bingkai arsitektur yang sudah ada, bukan mengganti komponen utama.

## Validasi setelah migrasi
- Pastikan semua endpoint API yang ada berfungsi.
- Pastikan data supabase tetap sesuai skema.
- Pastikan dashboard tetap menampilkan data analytics yang sama.
- Pastikan tracker SDK masih mengirim event ke collector tanpa perubahan flow.
