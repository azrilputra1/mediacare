# Medicare (latest)

Prototype aplikasi manajemen janji temu medis.

## Struktur
- `index.html`: aplikasi utama
- `public/assets/medicare-logo.png`: logo Medicare
- `vite.config.js`: konfigurasi build Vite dengan base relatif untuk deployment subfolder
- `capacitor.config.ts`: konfigurasi Capacitor Android

## Jalankan di web
```bash
npm install
npm run dev
```

## Build web
```bash
npm run build
```
Hasil build berada di folder `www`.

## Sinkronisasi Android
```bash
npm run sync:android
```

Catatan: prototype menggunakan Local Storage untuk data demo; belum merupakan backend autentikasi/database sungguhan.
