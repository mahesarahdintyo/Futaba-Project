# 📚 Panduan Pengguna (User Guide)

Aplikasi **Futaba Digital Document Management System** dirancang dengan dua hak akses utama: **Admin** untuk mengelola dokumen dan folder kerja, serta **Operator** untuk melihat dan menampilkan dokumen tersebut ke layar TV Display secara realtime.

---

## 🔑 1. Panduan Halaman Admin

Halaman Admin digunakan untuk mengatur struktur folder, mengunggah berkas kerja (SOP, Manual, Form), dan mengatur dokumen mana yang layak ditampilkan ke operator.

### 🗺️ Navigasi Dasar
- **Pilih Land**: Di halaman awal admin, pilih Land kerja (contoh: **500T**, **800T**, **2000T**) untuk masuk ke workspace spesifik Land tersebut.
- **Breadcrumb Navigation**: Gunakan breadcrumb di bagian atas workspace untuk melihat posisi folder Anda saat ini dan kembali ke folder induk dengan cepat.

### 📁 Pengelolaan Folder
- **Membuat Folder Baru**: Klik tombol **Create Folder** di header kanan atas, masukkan nama folder, lalu simpan.
- **Menghapus Folder**: Arahkan ke kartu folder dan klik ikon hapus jika folder tersebut sudah tidak diperlukan lagi.

### 📄 Pengelolaan Dokumen

#### A. Mengunggah Dokumen Baru
1. Klik tombol **Upload Document** di header kanan atas.
2. Isi formulir yang muncul:
   - **Document Title**: Judul dokumen (misalnya: "SOP Perakitan Awal").
   - **Description**: Keterangan tambahan (opsional).
   - **Target Waktu**: Masukkan tanggal dan waktu target (opsional).
   - **Pilih File**: Klik area dropzone atau seret file PDF/JPG/PNG Anda (Maksimal 5 file sekaligus, ukuran file maks 50MB per file).
3. Klik **Upload** dan tunggu hingga proses unggah selesai.

#### B. Mengedit Judul Dokumen & Nama File Asli (Inline Edit)
- **Mengedit Judul Dokumen (Atas)**:
  1. Klik ikon **Pencil** di samping judul dokumen pada kartu dokumen.
  2. Masukkan judul dokumen yang baru.
  3. Tekan tombol centang biru atau tekan tombol **Enter** untuk menyimpan.
- **Mengedit Nama File Asli (Bawah)**:
  1. Klik ikon **Pencil** di sebelah nama file fisik di bagian bawah kartu.
  2. Input teks edit hanya akan memuat basis nama file (ekstensi file seperti `.pdf` atau `.png` akan otomatis dipertahankan demi integritas file).
  3. Ubah nama file, lalu klik centang biru atau tekan **Enter** untuk menyimpan.

#### C. Mengatur Visibilitas Operator & Waktu Target
- **Sembunyikan dari Operator**: Klik ikon mata coret di kartu dokumen admin untuk menyembunyikan berkas dari operator (berguna untuk draft dokumen yang belum selesai disunting). Klik kembali ikon mata untuk menampilkannya kembali.
- **Set Target Waktu**: Isi tanggal dan waktu 24 jam pada bagian "Target Waktu" di kartu dokumen lalu klik **Simpan**.

#### D. Menghapus Dokumen
- Klik ikon tempat sampah merah (**Trash**) di kanan atas kartu dokumen, lalu konfirmasikan pada pop-up yang muncul untuk menghapus dokumen dari database dan cloud storage secara permanen.

---

## 📱 2. Panduan Halaman Operator (Tablet)

Halaman Operator diakses melalui tablet di masing-masing Land untuk mengontrol tampilan dokumen kerja yang akan dikirim ke TV Display.

### 🔍 Menemukan Dokumen
- **Navigasi Folder**: Masuk ke folder-folder kerja yang sesuai.
- **Pencarian Realtime**: Ketik judul atau deskripsi dokumen di kolom pencarian di bagian atas. Hasil pencarian akan disaring secara instan sewaktu Anda mengetik.

### 🖥️ Aksi Dokumen
Setiap dokumen memiliki dua tombol aksi utama untuk operator:
1. **Preview**: Klik tombol **Preview** (ikon mata) untuk membuka dan melihat isi dokumen di tab baru.
2. **Tampilkan**: Klik tombol hijau **Tampilkan** (ikon monitor) untuk mengirimkan dokumen ini ke layar TV Display secara realtime. Kartu dokumen yang aktif ditampilkan akan ditandai di tablet.

---

## 📺 3. Tampilan TV Display

Tampilan TV Display diletakkan di area kerja masing-masing Land (misal: digantung di dekat stasiun kerja).
- TV Display bekerja secara otomatis dan **tidak memerlukan interaksi fisik** (cukup dibuka sekali pada browser TV).
- Layar ini akan memuat dokumen yang dikirimkan oleh Operator secara realtime. Jika operator mengganti dokumen di tablet, TV Display akan memperbarui tampilannya dalam waktu kurang dari satu detik secara otomatis menggunakan koneksi database realtime.
