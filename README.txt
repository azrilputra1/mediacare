MEDICARE — SETUP AUTHENTIKASI & DATABASE FIREBASE
==================================================

ISI FOLDER
----------
- index.html          Halaman login/register dan aplikasi
- style.css           Desain seluruh halaman
- app.js              JavaScript, Firebase Auth, Firestore, kalender, CRUD janji temu
- medicare-logo.png   Logo (letakkan file logo Anda di sini)
- README.txt          Panduan setup

PENTING
-------
Login sungguhan memerlukan project Firebase milik Anda. Jangan membagikan
private key, password akun, atau kredensial Firebase ke orang lain.
Firebase web apiKey bukan password admin, tetapi tetap atur Security Rules.

LANGKAH 1 — BUAT PROJECT FIREBASE
---------------------------------
1. Buka https://console.firebase.google.com/
2. Klik Add project dan buat project, misalnya "medicare-app".
3. Setelah project dibuat, klik ikon Web (</>) untuk menambahkan aplikasi web.
4. Daftarkan nama aplikasi "Medicare Web".
5. Firebase akan menampilkan firebaseConfig. Salin nilainya.

LANGKAH 2 — AKTIFKAN EMAIL/PASSWORD
-----------------------------------
1. Firebase Console → Build → Authentication.
2. Klik Get started.
3. Buka tab Sign-in method.
4. Pilih Email/Password.
5. Aktifkan Email/Password lalu Save.

LANGKAH 3 — BUAT FIRESTORE DATABASE
-----------------------------------
1. Firebase Console → Build → Firestore Database.
2. Klik Create database.
3. Pilih lokasi yang dekat dengan pengguna (misalnya asia-southeast2 jika tersedia).
4. Selesaikan pembuatan database.

LANGKAH 4 — MASUKKAN KONFIGURASI
--------------------------------
Buka app.js. Cari:

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

Ganti nilai placeholder dengan nilai yang diberikan Firebase Console.
Gunakan nilai persis dari Firebase, jangan menebak storageBucket.
Simpan file.

LANGKAH 5 — ATUR FIRESTORE SECURITY RULES
-----------------------------------------
Firebase Console → Firestore Database → Rules.
Untuk contoh proyek kuliah, gunakan aturan berikut agar pengguna hanya
bisa membaca/menulis dokumen janji temu miliknya sendiri:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appointments/{appointmentId} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;

      allow read, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;

      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
    }
  }
}

Klik Publish.
Jangan menggunakan mode test terbuka untuk aplikasi yang dipublikasikan.
Aturan ini adalah baseline sederhana untuk proyek demonstrasi; aplikasi
produksi perlu validasi tambahan (field, tipe data, status, dan batasan).

LANGKAH 6 — JALANKAN WEBSITE
----------------------------
Firebase modular SDK diimpor sebagai ES modules. Jalankan dari server lokal,
bukan membuka file index.html langsung.
Pilihan:
- VS Code → install ekstensi Live Server → klik kanan index.html → Open with Live Server.
- Atau terminal di folder proyek: python3 -m http.server 5500
  lalu buka http://localhost:5500

LANGKAH 7 — GITHUB PAGES
------------------------
1. Upload index.html, style.css, app.js, dan medicare-logo.png ke root repository.
2. Pastikan Firebase Authentication → Settings → Authorized domains
   mencakup domain GitHub Pages Anda (contoh: username.github.io).
3. Buka URL GitHub Pages dan coba daftar akun.
4. Periksa Authentication → Users untuk melihat akun yang berhasil dibuat.
5. Periksa Firestore → Data untuk melihat dokumen appointments.

FITUR YANG SUDAH ADA
--------------------
- Register akun email/password melalui Firebase Authentication.
- Login dan logout.
- Reset password melalui email.
- Dashboard berdasarkan akun yang sedang login.
- Data janji temu disimpan di Cloud Firestore.
- Tambah, ubah, dan hapus janji temu.
- Kalender dengan penanda tanggal yang memiliki janji temu.
- Daftar dokter contoh, riwayat, dan profil akun.
- Tampilan responsif desktop dan mobile.

BATASAN / CATATAN
-----------------
- Daftar dokter dan klinik pada contoh ini adalah data contoh, bukan data
  fasilitas kesehatan sungguhan.
- Belum ada sistem verifikasi dokter, pembayaran, integrasi rumah sakit,
  atau sinkronisasi dengan sistem rekam medis.
- Pengingat push/background belum diimplementasikan. Browser notification
  tidak dijamin berjalan ketika browser ditutup. Untuk push notification
  diperlukan Firebase Cloud Messaging dan konfigurasi service worker.
- Jangan masukkan data medis sensitif pasien sungguhan ke demo ini.
- Untuk produksi, perlu kebijakan privasi, persetujuan pasien, validasi
  backend, audit keamanan, dan kepatuhan regulasi perlindungan data.
