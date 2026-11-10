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

## I. Pembaruan: Materi Sesuai Template PPTX & Layar Penuh
- Isi **14 slide** kini mengikuti berkas *Presentasi_Digitalisasi_Pembelajaran_BOSKIN_2026_Tema_Bimtek.pptx*: urutan, judul, dan teks yang sama. Tampilan meniru template (latar kelas, lambang, logo #PendidikanBermutu/Ramah, foto sampul, palet biru–teal–oranye, pita kuning-biru di bawah) dengan font **Figtree**. Aset gambar ada di folder `img/`; ganti file di sana bila ingin mengubahnya.
- **Layar penuh yang mulus:** panggung slide dibuat sekali dan hanya isinya yang berganti, jadi layar penuh tidak pernah terlepas. Pindah slide: **→ ↓ PageDown Spasi** (maju), **← ↑ PageUp Backspace** (mundur), **Home/End**, tombol panah di layar, atau geser jari. Tekan **F** untuk masuk/keluar layar penuh, **Esc** untuk keluar. Bilah kontrol muncul saat mouse digerakkan lalu hilang otomatis.
- Slide diskalakan otomatis ke ukuran layar/proyektor (rasio 16:9). Di iPhone yang tidak mendukung layar penuh asli, dipakai mode layar penuh tiruan.
- Narasi pemateri tetap hanya tampil untuk admin di bawah slide (tidak tampil saat layar penuh).
- Teks slide diubah lewat `js/materi.js`.

## J. Pembaruan: Ikon Interaktif, Tampilan Dinamis, dan Performa
- **Ikon situs** (tab browser): lambang topi wisuda ungu di `img/favicon.svg`, plus ikon aplikasi (`icon-192/512.png`, `apple-touch-icon.png`) dan `manifest.webmanifest` sehingga situs bisa "Tambahkan ke layar utama". Ikon **interaktif**: muncul **titik hijau** saat ada sesi JP yang dibuka; bila tab Anda sedang di latar, ikon **berkedip** dan judul tab diawali "●".
- **Micro-interaction:** riak pada tombol, efek tekan, spinner saat mengirim lalu "✓ Terkirim", kartu terangkat dan miring 3D halus mengikuti kursor, angka dashboard menghitung naik, garis grafik menggambar diri, ikon menu bergoyang saat disentuh.
- **Skeleton shimmer** per halaman (beranda, dashboard, materi, sumber, tabel, formulir) dengan ukuran sama seperti konten asli agar layout tidak melompat.
- **Cepat:** font dimuat tanpa memblokir tampilan; script `defer`; `preconnect` ke Google Apps Script; efek kursor hanya menggambar saat ada gerakan (hemat CPU/baterai); latar aurora memakai animasi transform saja; panggilan data publik dibatasi 8 detik dan di-prefetch saat menu disentuh; service worker menyimpan gambar (halaman, CSS, dan JS tetap selalu versi terbaru dari jaringan).
- **Aksesibilitas:** cincin fokus keyboard, target sentuh minimal 44px di layar sentuh, dan semua animasi mati bila perangkat memakai "kurangi gerakan".
- Setelah push, lakukan Ctrl+Shift+R sekali; service worker lama (jika ada) akan diganti otomatis.

## K. Pembaruan: Karya ke-6, Slide Dinamis, Logo Utuh, Generator RPP
- **Slide 7** kini memuat **enam karya**; yang baru: *Jelajahi Dunia Digital dengan Aman*. Deskripsinya masih umum (isi karya tidak terbaca dari ZulfaSpace); sesuaikan di `js/materi.js` (slide 7 dan bagian `karya`).
- **Font slide yang tidak kaku:** tombol **Aa** di bilah slide (atau tekan **T**, juga saat layar penuh) berganti gaya: *Luwes* (Baloo 2 + Nunito, bawaan), *Modern* (Plus Jakarta Sans), *Elegan* (Fraunces + Figtree), *Ramah* (Poppins), *Template* (Figtree). Pilihan tersimpan. Ukuran teks menyesuaikan otomatis agar tidak meluap.
- **Tata letak dinamis:** judul muncul kata demi kata dengan kata kunci disorot (tulis `*kata*` di `js/materi.js`); kartu bergantian posisi (zig-zag), bertingkat (tangga/tangga naik), dan garis waktu; poin masuk berurutan. **Klik sebuah kartu/baris** untuk menyorot poin itu (yang lain meredup); klik lagi untuk batal.
- **Logo Tut Wuri Handayani utuh** (`img/emblem.png`) — sebelumnya bagian bawahnya terpotong. Logo diambil dari berkas PPTX template Anda.
- **Sumber Belajar** kini diawali bagian **Generator Modul Ajar**: *RPP/Modul Ajar Pembelajaran Mendalam* dan *RPP/Modul Ajar Kokurikuler* (tautan Gemini + QR Code + tombol salin). Tautan dapat diubah di `js/materi.js` bagian `alat`.

## L. Pembaruan: Tata Letak Slide Dirapikan + Tombol Info
- **Slide 3 (Teknologi sebagai sarana)** dan semua slide berbentuk baris: kolom kini sejajar (lencana — judul — keterangan bergaris pemisah), dan keterangan tidak lagi melayang.
- **Slide 4 (Deep Learning & TPACK)** didesain ulang: tiga prinsip (Berkesadaran, Bermakna, Menggembirakan), tiga langkah pengalaman belajar, serta CK / PK / TK beserta irisan TPACK.
- **Tombol “i”** pada setiap poin (slide 4, 5, dan 12) membuka kotak **Penjelasan + Contoh**. Tutup dengan tombol ✕, klik di luar kotak, tombol Esc, atau pindah slide. Berfungsi juga saat layar penuh.
- **Slide 5** kini berisi nomor, pertanyaan, label media, dan kotak contoh. **Slide 7** memakai kartu tertata (label fokus di atas, judul dan deskripsi sejajar).
- **Slide 12 (Berbagi Hasil Karya)** memuat contoh penerapan dari ZulfaSpace: *Petualangan Pecahan Season 2* — tujuan, interaksi, hingga asesmen. Contoh ini **rancangan** berdasarkan nama dan fokus karya; sesuaikan dengan fitur aktual di `js/materi.js`.
- Isi penjelasan dan contoh tiap tombol “i” ada di `js/materi.js` bagian `info`. Itu draf saya; mohon dicocokkan dengan bahan Bimtek Anda.
- Perbaikan: angka kartu pada slide 5 dan 10 sempat hilang bila halaman dimuat langsung di slide tersebut (bentrok dengan efek hitung-naik dashboard) — sudah diperbaiki.

## M. Pembaruan: Contoh Dunia Digital Aman, Pratinjau Langsung, Penjelasan TPACK
- **Semua contoh** (slide 5, 10, 11, 12 dan seluruh tombol “i”) kini memakai media **“Menjelajahi Dunia Digital dengan Aman”** (https://zlfdnt.github.io/dunia-digital-aman/). Yang terverifikasi dari laman itu hanya judul dan deskripsinya: media interaktif Koding Bab 2 untuk SMP Kelas VII tentang cara kerja internet, literasi digital, dan keamanan data pribadi. Isi contoh adalah **rancangan** berdasarkan topik tersebut; sesuaikan dengan fitur aktual di `js/materi.js`.
- **Pratinjau langsung** (laman asli tampil di dalam slide, bukan gambar statis): slide 5 (bingkai ponsel + tombol Perbesar), tombol **Lihat media contoh** di slide 10, 11, dan 12, serta tombol **Pratinjau** pada tiap karya di slide 7 (dengan tombol ‹ › untuk berpindah karya dan “Buka di tab baru”). Pratinjau memerlukan internet.
- **Slide 7:** lima karya pertama sementara memuat portofolio ZulfaSpace; ganti `url` tiap karya di `js/materi.js` bila Anda sudah punya tautan langsungnya.
- **TPACK (slide 4):** klik strip biru “Ketiganya selaras = TPACK” untuk penjelasan sederhana: apa itu TPACK, mengapa penting bagi digitalisasi, dan apakah bisa diterapkan tanpa digitalisasi, lengkap dengan contoh versi digital dan non-digital.
- Slide 11 kini memberi contoh untuk setiap poin produk minimal.

## N. Pembaruan: Tautan Langsung Keenam Karya
Pratinjau di slide 7 kini memuat laman asli tiap karya: Petualangan Pecahan Season 2 (`/petualangan_pecahan_seasondua/`), Pseudocraft (`/pseudocraft/`), Pseudocode Lab (`/Pseudocode_Lab/`), Pythagoras Digital (`/PythagorasDigital/`), GeoQuest3D (`/geoquest-3d/`), dan Menjelajahi Dunia Digital dengan Aman (`/dunia-digital-aman/`), semuanya di `zlfdnt.github.io`. Label dan keterangan kartu diambil dari judul/deskripsi tiap laman. Bila suatu karya tidak tampil di jendela pratinjau (tergantung pengaturan laman), gunakan tombol **Buka di tab baru**. Menu **Praktik Baik** juga memiliki tombol **Buka** untuk tiap karya.
