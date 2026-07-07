# 🚀 Futaba Digital Document Management System

**Futaba Digital Document Management System** adalah platform manajemen dan penampil dokumen kerja (SOP, User Manual, Form Kerja) yang dirancang khusus untuk lini produksi PT FUTABA. 

Sistem ini memungkinkan **Operator** melalui perangkat tablet untuk memilih dan menampilkan dokumen kerja yang sedang aktif secara realtime ke **TV Display** di stasiun kerja, sedangkan **Admin** mengelola berkas, struktur folder, target waktu, visibilitas operator, serta mengubah judul dokumen dan nama berkas kerja secara mudah.

---

## 📸 Screenshots & Antarmuka Aplikasi

### 👑 Dashboard Admin
Halaman utama bagi administrator untuk mengelola folder, mengunggah dokumen, menentukan target penyelesaian waktu, dan melakukan inline edit pada judul/nama file.
![Dashboard Admin](/public/admin-screenshot.png)

### 📱 Dashboard Operator (Tablet)
Antarmuka sentuh yang ringan bagi operator di lini produksi untuk mencari dokumen kerja secara instan dan mengirimkannya langsung ke layar monitor display.
![Dashboard Operator](/public/operator-screenshot.png)

### 📺 TV Display Lini Produksi
Layar penampil utama di stasiun kerja yang memuat dokumen aktif yang dipilih oleh operator secara realtime tanpa perlu interaksi fisik.
![TV Display](/public/display-screenshot.png)

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan teknologi modern dan handal untuk performa optimal serta realtime rendering:

- **Frontend & API Routes**: Next.js 16 (React 19 & TypeScript) dengan Turbopack untuk kompilasi ultra-cepat.
- **Desain & UI**: Tailwind CSS & shadcn/ui untuk desain antarmuka yang bersih, responsif, dan premium.
- **Backend / Database**: Supabase (PostgreSQL Database, Storage Bucket untuk penyimpanan berkas PDF/JPG/PNG, dan Supabase Realtime Channels untuk sinkronisasi instan).
- **Manajemen Paket**: pnpm.

---

## 📦 Panduan Instalasi Lokal

### 1. Prasyarat Sistem
Pastikan Anda sudah menginstal:
- **Node.js** (Versi 18.x atau lebih baru)
- **pnpm** (Sistem manajemen paket utama)

### 2. Langkah-langkah Setup
1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/mahesarahdintyo/Futaba-Project.git
   cd Futaba-Project
   ```

2. **Instal Dependencies**:
   ```bash
   pnpm install
   ```

3. **Konfigurasi Environment**:
   Buat file `.env.local` di root folder proyek dan isi dengan API keys Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Inisialisasi Skema Database**:
   Jalankan query SQL pembuatan tabel (`lands`, `folders`, `categories`, `documents`, `land_display_documents`) yang tercantum dalam berkas dokumentasi [docs/INSTALLATION.md](file:///c:/laragon/www/Futaba-Project/docs/INSTALLATION.md).

5. **Buat Storage Bucket**:
   Di dashboard Supabase, buat bucket storage public baru dengan nama `documents` untuk menyimpan berkas dokumen.

---

## 💻 Cara Menjalankan Aplikasi

Jalankan Next.js server dalam mode pengembangan (development):
```bash
pnpm dev
```
Aplikasi akan aktif di browser pada alamat **[http://localhost:3000](http://localhost:3000)**.

---

## 📖 Dokumentasi Lengkap

Untuk instruksi dan panduan yang lebih mendalam, silakan baca dokumentasi di folder `docs/`:
- **[INSTALLATION.md](file:///c:/laragon/www/Futaba-Project/docs/INSTALLATION.md)**: Panduan penyiapan database lokal & bucket.
- **[DEPLOYMENT.md](file:///c:/laragon/www/Futaba-Project/docs/DEPLOYMENT.md)**: Panduan deploy ke platform Vercel & konfigurasi RLS keamanan produksi.
- **[USER_GUIDE.md](file:///c:/laragon/www/Futaba-Project/docs/USER_GUIDE.md)**: Panduan penggunaan bagi Admin, Operator, dan setup TV Display.
- **[TESTING.md](file:///c:/laragon/www/Futaba-Project/docs/TESTING.md)**: Panduan pengujian fungsionalitas (TypeScript tsc, build check, & manual checklist).
- **[API_REFERENCE.md](file:///c:/laragon/www/Futaba-Project/docs/API_REFERENCE.md)**: Referensi format kueri, payload, dan skema respons API endpoint.
