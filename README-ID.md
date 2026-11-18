# Medicare — Lanjutan Ubah Jadwal & Pengingat

Project ini melanjutkan prototype Medicare yang Anda kirim. Logo dan alur halaman lama dipertahankan, lalu ditambahkan:
- Tombol **Ubah Jadwal** pada janji temu pasien yang masih aktif.
- Form untuk mengganti tanggal dan jam kunjungan.
- Validasi tanggal/waktu harus di masa depan.
- Pemeriksaan bentrok sederhana untuk dokter dan waktu yang sama.
- Pengingat Android pada 1 hari, 3 jam, dan 30 menit sebelum janji temu berstatus diterima.
- Pengingat lama dibatalkan dan dibuat ulang ketika jadwal diubah.

## Menjalankan di MacBook
Dari Terminal, masuk ke folder project ini, lalu jalankan:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

Di Android Studio, tunggu Gradle selesai lalu tekan Run.

## Menjalankan versi web saat mengedit
```bash
npm run dev
```

## Catatan
- Source utama ada di `index.html`. Build Vite menghasilkan file web ke folder `www` sesuai `capacitor.config.ts`.
- Fitur pengingat memerlukan izin notifikasi di Android.
- Notifikasi dijadwalkan secara lokal pada perangkat yang memasang aplikasi. Ini bukan push notification lintas perangkat.
- Penyimpanan masih menggunakan Local Storage, sama seperti prototype asal. Data pasien tidak tersinkron ke akun dokter pada perangkat lain.
- Pemeriksaan bentrok masih lokal dan sederhana, bukan validasi server.
- Jangan gunakan data medis pasien nyata untuk prototype ini.
- Keystore dan password signing tidak disertakan dalam paket. Simpan secara pribadi.
