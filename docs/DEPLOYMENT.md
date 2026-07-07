# 🚀 Panduan Deployment Produksi

Dokumen ini memandu Anda dalam melakukan deployment aplikasi **Futaba Digital Document Management System** ke lingkungan produksi (seperti Vercel atau server mandiri) serta mengkonfigurasi database Supabase produksi secara aman.

---

## ☁️ Deployment Frontend & API (Next.js)

Cara termudah dan paling direkomendasikan untuk melakukan deploy aplikasi Next.js adalah menggunakan platform **Vercel**.

### Langkah 1: Hubungkan Git ke Vercel
1. Masuk ke akun [Vercel](https://vercel.com).
2. Klik tombol **New Project** atau **Add New > Project**.
3. Hubungkan repositori GitHub Anda (`mahesarahdintyo/Futaba-Project`).
4. Pilih cabang utama pengembangan Anda (misalnya `develop` atau `main`).

### Langkah 2: Konfigurasi Environment Variables di Vercel
Sebelum mengklik deploy, buka bagian **Environment Variables** pada konfigurasi Vercel dan tambahkan variabel-variabel berikut (gunakan nilai API keys dari Supabase proyek produksi Anda):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Langkah 3: Build & Deploy
1. Klik **Deploy**. Vercel akan otomatis mendeteksi konfigurasi Next.js dan menjalankan perintah build (`next build`).
2. Proses deployment selesai dalam beberapa menit dan Anda akan mendapatkan URL produksi publik yang aman (HTTPS).

---

## 🔒 Mengamankan Supabase Produksi (Penting!)

Selama tahap pengembangan, beberapa tabel dan bucket storage dikonfigurasi menggunakan hak akses **Public Write** atau tanpa otentikasi. Untuk lingkungan produksi, Anda **wajib** mengubah dan memperketat Row Level Security (RLS) di Supabase.

### 1. Memperketat RLS Tabel `documents`, `folders`, `lands`
Di lingkungan produksi, hanya admin yang boleh melakukan perubahan data (Insert, Update, Delete). Anda dapat menggunakan otentikasi Supabase dan memperbarui policy SQL di Supabase dashboard:

```sql
-- Mengaktifkan RLS pada tabel
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;

-- Policy untuk semua pengguna (termasuk operator & TV): Hanya membaca data (SELECT)
CREATE POLICY "Allow public read documents" 
ON public.documents FOR SELECT 
USING (true);

CREATE POLICY "Allow public read folders" 
ON public.folders FOR SELECT 
USING (true);

CREATE POLICY "Allow public read lands" 
ON public.lands FOR SELECT 
USING (true);

-- Policy untuk admin: Memerlukan otentikasi (authenticated) untuk menulis/menghapus
CREATE POLICY "Allow admin write documents" 
ON public.documents FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow admin write folders" 
ON public.folders FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow admin write lands" 
ON public.lands FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

### 2. Mengamankan Storage Bucket `documents`
Ubah Policy di menu **Storage > Policies**:
- **Read/Select Policy**: Diizinkan untuk publik (`true` atau anonymous).
- **Upload/Insert/Delete Policy**: Batasi target role hanya untuk `authenticated` user saja.

---

## 🛠️ Pemeliharaan (Maintenance) & Pembaruan
Setiap kali ada pembaruan kode pada repositori GitHub Anda:
1. Hubungkan branch target deployment Anda di Vercel agar melakukan **Auto-deploy** setiap kali ada commit/push baru.
2. Jika ada perubahan database, jalankan migrasi database di SQL Editor Supabase produksi sebelum melakukan deploy pembaruan kode frontend.
