# Panduan Instalasi — BOSKIN 2026 (Guru Kreatif, Siswa Aktif)

Arsitektur: **Frontend** (GitHub Pages) → `fetch` → **Backend** Google Apps Script (JSON) → **Google Sheets**.

## A. Backend (Google Apps Script) — dahulu
1. Buka https://script.google.com → **Proyek baru**.
2. Hapus isi `Code.gs`, tempel seluruh isi **Kode.gs** (berkas terpisah), simpan.
3. Pilih fungsi `setupAppEnvironment` → ▶ **Run** (SEKALI; aman diulang). Izinkan akses Drive/Sheets.
4. Buka **Execution log**: **catat sandi akses darurat** (hanya tampil sekali). Spreadsheet database dibuat otomatis, akun Google Anda otomatis menjadi admin pertama.
5. **Login Google admin (disarankan):** di Google Cloud Console → *APIs & Services → Credentials → Create OAuth client ID → Web application*. Pada **Authorized JavaScript origins** isi `https://USERNAME.github.io`. Salin Client ID (berakhiran `.apps.googleusercontent.com`).
   Di Apps Script: ⚙️ **Setelan Proyek → Script Properties → Tambah**: `GOOGLE_CLIENT_ID` = Client ID tadi.
   > Client ID bukan rahasia, tetapi tetap disimpan di Script Properties agar tidak di-hardcode.
6. **Deploy → New deployment → Web app** · *Execute as*: **Me** · *Who has access*: **Anyone** → Deploy → **salin URL `/exec`**.
7. Tambah admin lain: buka Spreadsheet database → sheet **Admin** → isi email Google (huruf kecil).
8. Ubah Kode.gs di kemudian hari: **Deploy → Manage deployments → ✏️ → New version** (jangan *New deployment*, URL akan berubah).

**Rahasia:** `SESSION_SECRET`, hash sandi darurat, dan `GOOGLE_CLIENT_ID` hanya ada di Script Properties — tidak di kode, Sheets, maupun frontend. Jangan menambah editor proyek Apps Script sembarangan dan jangan bagikan spreadsheet database. Rotasi sandi darurat: jalankan `resetAksesDarurat()`; keluarkan semua sesi admin: `rotasiSecretSesi()`.

## B. Frontend (GitHub Pages)
ZIP `inovasi-digital-kelas.zip` sudah berisi `index.html` di **root**. Folder hasil ekstrak (**inovasi-digital-kelas**) adalah folder yang di-`git init`.

1. Ekstrak ZIP. Buka `js/config.js`, ganti `GANTI_DENGAN_ID_DEPLOYMENT` dengan URL `/exec` lengkap Anda. Simpan.
2. Install Git (https://git-scm.com), buat akun GitHub, lalu buat repository **Public** baru bernama **`inovasi-digital-kelas`** dengan deskripsi: *Materi Pengimbasan dan Sumber Belajar Digitalisasi Pembelajaran untuk Transformasi Kelas yang Inspiratif.* (jangan centang README).
3. Buka PowerShell/Terminal, masuk ke folder hasil ekstrak, dan **pastikan `index.html` terlihat**:
   ```
   cd "C:\path\ke\inovasi-digital-kelas"
   dir        # (Mac/Linux: ls)  → harus tampil index.html, css, js
   ```
4. Kirim ke GitHub (ganti USERNAME dengan username GitHub Anda):
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/inovasi-digital-kelas.git
   git push -u origin main
   ```
   Saat diminta password, pakai **Personal Access Token** (GitHub → Settings → Developer settings → Tokens, scope `repo`). Layar tidak menampilkan karakter saat mengetik — itu normal.
5. Repo → **Settings → Pages** → *Deploy from a branch* → `main` / `/ (root)` → Save. Tunggu 1–2 menit; situs: `https://USERNAME.github.io/inovasi-digital-kelas/`.
6. Setelah mengedit file: `git add .` → `git commit -m "update"` → `git push`, lalu Ctrl+Shift+R.
> Jangan unggah lewat tombol "Upload files" di web GitHub — struktur folder `css/` & `js/` rusak.

## C. Uji cepat
1. Buka situs → **Masuk Admin** → dashboard → **Buka Sesi** JP 1.
2. Di ponsel: Absensi → isi → kirim; kirim lagi (harus ditolak: absen ganda).
3. Kirim Refleksi dan Lembar Praktik → cek di **Rekap** → Setujui/Revisi → **Unduh Excel**.
4. Menu **Kelola** → ganti tautan contoh ZulfaSpace dengan tautan asli; QR Code otomatis mengikuti.

## D. Unggah Berkas ke Google Drive
- Peserta bisa mengisi **tautan** atau **mengunggah berkas** (PDF, JPG, PNG, PPTX, maks. 5 MB) di halaman Praktik.
- Berkas masuk ke folder Drive **📂 BOSKIN 2026 — Uploads** (dibuat otomatis oleh `setupAppEnvironment()`; tautannya tampil di log). Nama berkas: `waktu_nama_peserta.ext`, dan kolom `tautan`/`berkas` di sheet Praktik terisi otomatis.
- Server memeriksa ekstensi, ukuran, dan isi berkas (bukan hanya nama). Berkas diatur **“siapa saja dengan tautan dapat melihat”** agar kurator bisa membukanya; ubah di Drive bila ingin lebih tertutup.
- Kuota Drive mengikuti akun pemilik skrip.

## E. Optimasi Performa (yang sudah aktif)
- **Cache berversi per sheet:** menulis ke satu sheet tidak menghanguskan cache sheet lain; cache besar otomatis dipecah (batas 100 KB CacheService).
- **Beranda/Sumber instan:** data publik (`boot`) di-cache di server dan di perangkat; layar tampil seketika lalu disegarkan di latar.
- **Dashboard + rekap dalam 1 eksekusi** (endpoint `batch`, maks. 10 aksi baca), hasil dashboard di-cache.
- **Pemanasan:** browser memanggil `?w=pub` saat situs dibuka; polling dashboard hanya saat tab terlihat. Waktu kerja server tampil di respons (`ms`).
- Ukuran dampaknya belum diuji dengan ratusan perangkat — lakukan uji beban sesuai PRD tahap 3 sebelum hari kegiatan.

## F. Memperbarui Backend yang Sudah Terpasang
1. Tempel `Kode.gs` terbaru → Simpan.
2. Jalankan `setupAppEnvironment()` **sekali lagi** (aman; menambah kolom `berkas` di sheet Praktik, membuat folder Uploads, dan meminta izin Drive baru — klik *Review permissions*).
3. **Deploy → Manage deployments → ✏️ → New version** (URL `/exec` tetap sama).
4. Frontend: ganti file, `git add .` → `git commit -m "update"` → `git push`, lalu Ctrl+Shift+R.

## G. Catatan & batasan versi ini
- Unduhan rekap berformat **.csv** (terbuka di Excel), bukan .xlsx.
- Modul migrasi data (gas-migrasi-database) belum disertakan karena ini aplikasi baru tanpa data lama.
- Belum ada antrean notifikasi atau trigger keep-warm terjadwal (belum dibutuhkan; tidak ada notifikasi WA/email).
- Ilustrasi: slide bawaan memakai gradien + emoji; tambahkan foto sendiri lewat kolom *gambar* di Kelola (tautan https dipisah `|`).
- Kursor `+` berpartikel hanya aktif di perangkat dengan mouse dan nonaktif bila pengguna memilih "kurangi animasi".

## H. Pembaruan: Materi Presentasi, Praktik Baik, dan Tampilan Baru
**Menu baru**
- **Materi** — 14 slide "Digitalisasi Pembelajaran" (gabungan Lampiran 1 dan 2): navigasi panah keyboard, mode layar penuh, tab *Jadwal 105 menit* dan *Persiapan* (checklist tersimpan di perangkat). **Narasi pemateri** hanya tampil bila Anda masuk sebagai admin.
- **Praktik Baik** — pratinjau ZulfaSpace (https://zlfdnt.github.io/zulfaspace/), QR Code, dan ringkasan lima karya.
- **Beranda** dirombak: status sesi JP langsung, kartu aksi cepat, ringkasan materi, dan sumber belajar terbaru. Dashboard admin memakai ikon dan kartu baru.

**Sumber Belajar awal** — jalankan `setupAppEnvironment()` sekali lagi (aman diulang). Fungsi ini menambahkan: folder Drive materi, ZulfaSpace, dan 5 referensi kebijakan (Ditsmp, BPMP Kepri, Ruang Murid, dll.), serta menghapus baris contoh `example.com` bila ada. Lalu Deploy → New version.

**Perhatian**
- Isi folder Drive belum bisa saya baca. Agar berkas di dalamnya tampil satu per satu, tambahkan tautan tiap berkas lewat menu **Kelola**, dan pastikan folder/berkas diatur "siapa saja dengan tautan".
- Isi materi di `js/materi.js` (repo publik): narasi hanya disembunyikan di tampilan, bukan dirahasiakan. Jangan taruh data sensitif di sana.
- Deskripsi lima karya masih kerangka dari Lampiran 1; sesuaikan dengan fitur aktual lewat `js/materi.js` (bagian `karya` dan slide 8).
