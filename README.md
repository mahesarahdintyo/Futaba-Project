# 🏭 Futaba PKIS — Production & Knowledge Information System

**Futaba PKIS** adalah sistem informasi produksi dan manajemen dokumen kerja digital yang dirancang khusus untuk lini produksi **PT FUTABA**. Sistem ini menggabungkan dua fungsi utama dalam satu platform terintegrasi:

1. **Manajemen Dokumen Kerja** — Admin mengelola SOP, manual, dan form kerja. Operator di tablet menampilkan dokumen ke layar TV Display secara realtime.
2. **Laporan Produksi Harian** — Operator mengisi laporan produksi (QTY, NG, Kategori NG) langsung dari tablet, dan Admin memantau serta menganalisis data tersebut di dashboard.

---

## ✨ Fitur Utama

### 👑 Admin
| Fitur | Keterangan |
|---|---|
| Workspace Dokumen | Kelola folder, unggah/hapus dokumen SOP/Manual/Form per lini (Land) |
| Laporan Produksi | Pantau laporan harian semua operator secara realtime - filter, search, export CSV |
| Detail Laporan | Lihat detail lengkap + salin laporan ke clipboard |
| Hapus Laporan | Hapus laporan dengan konfirmasi modal |
| Manajemen Part Number | Tambah & hapus part number yang langsung tersinkron ke dropdown operator |
| **Manajemen Kategori NG** | Tambah & hapus kategori cacat (NG) yang dipakai operator |

### 📱 Operator
| Fitur | Keterangan |
|---|---|
| Tampilkan Dokumen | Pilih & kirim dokumen ke TV Display secara realtime |
| Laporan Produksi | Isi QTY, NG, Kategori NG per sesi produksi; hasilnya langsung muncul di dashboard admin |
| Kategori NG Dinamis | Pilihan kategori NG muncul otomatis saat NG > 0, wajib dipilih |
| Validasi Form | QTY tidak boleh 0; Kategori NG wajib jika ada NG |

### 📺 TV Display
- Menampilkan dokumen aktif secara realtime (update < 1 detik)
- Tidak memerlukan interaksi fisik — cukup buka sekali di browser

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (React 19 + TypeScript) + Turbopack |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Storage** | Supabase Storage Bucket (`documents`) |
| **Realtime** | Supabase Realtime Channels |
| **Auth** | Supabase Auth (email/password) + RBAC middleware |
| **Package Manager** | pnpm |

---

## 📦 Struktur Proyek

```
Futaba-Project/
├── app/
│   ├── admin/                  # Halaman Admin (workspace + laporan + manajemen)
│   ├── operator/               # Halaman Operator (tablet)
│   ├── display/[landId]/       # Halaman TV Display per lini
│   ├── system/                 # Halaman System Status
│   └── api/                    # API Routes (Next.js Route Handlers)
│       ├── ng-categories/      # CRUD kategori NG
│       ├── part-numbers/       # CRUD part number
│       ├── production-reports/ # CRUD laporan produksi
│       ├── documents/          # CRUD dokumen
│       ├── folders/            # CRUD folder
│       ├── lands/              # CRUD lini produksi (land)
│       └── ...
├── components/
│   ├── admin/
│   │   ├── AdminLandCard.tsx               # Card Land admin (pindah)
│   │   ├── CreateLandDialog.tsx            # Dialog buat Land admin (pindah)
│   │   ├── ProductionReportsDashboard.tsx  # Dashboard laporan produksi admin
│   │   ├── AdminPartNumbersPanel.tsx       # Panel manajemen part number
│   │   └── AdminNgCategoriesPanel.tsx      # Panel manajemen kategori NG
│   ├── operator/
│   │   ├── OperatorHeader.tsx
│   │   ├── ProductionReportForm.tsx        # Form laporan produksi operator
│   │   └── DocumentList.tsx                # List berkas di operator (pindah)
│   └── ui/                                 # Komponen reusable / umum (pindah)
│       ├── app-header.tsx
│       ├── category-filter.tsx
│       ├── create-folder-dialog.tsx
│       ├── document-card.tsx
│       ├── folder-card.tsx
│       ├── login-form.tsx
│       ├── logout-button.tsx
│       ├── search-bar.tsx
│       └── upload-dialog.tsx
├── lib/
│   └── services/               # Service layer (fetch helpers)
│       ├── production-report.ts
│       ├── part-number.ts
│       ├── ng-category.ts
│       └── ...
└── supabase/
    └── migrations/             # File SQL migrasi database
```

---

## 🚀 Panduan Setup Lokal

### Prasyarat
- **Node.js** v18+ (LTS recommended)
- **pnpm** (`npm install -g pnpm`)
- **Akun Supabase** (free tier cukup)

### 1. Clone & Install

```bash
git clone https://github.com/mahesarahdintyo/Futaba-Project.git
cd Futaba-Project
pnpm install
```

### 2. Environment Variables

Buat file `.env.local` di root proyek:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Setup Database Supabase

Jalankan semua file SQL di folder `supabase/migrations/` secara berurutan via **Supabase SQL Editor**:

| File | Keterangan |
|---|---|
| `20260708_create_production_reports.sql` | Tabel laporan produksi + RLS |
| `20260710_create_part_numbers.sql` | Tabel part number + RLS |
| `ng_categories.sql` | Tabel kategori NG + RLS |
| *(migrations lainnya)* | Lihat folder `supabase/migrations/` |

Untuk tabel dasar (`lands`, `folders`, `documents`, dll.) lihat [docs/INSTALLATION.md](./docs/INSTALLATION.md).

### 4. Setup Storage Bucket

Di dashboard Supabase → **Storage** → buat bucket bernama `documents` → set **Public**.

### 5. Jalankan Aplikasi

```bash
pnpm dev        # Development mode
# atau
pnpm build && pnpm start   # Production mode
```

Buka **[http://localhost:3000](http://localhost:3000)**.

---

## 🧭 Alur Penggunaan

```
Admin Login
  └─ Tab: Workspace     → Kelola dokumen/folder per lini
  └─ Tab: Laporan Produksi -> Pantau laporan operator secara realtime
  └─ Tab: Part Number   -> Tambah/hapus part number, dropdown operator otomatis update
  └─ Tab: Kategori NG  → Tambah/hapus kategori cacat

Operator (tablet)
  └─ Pilih Part Number
  └─ Sistem otomatis set waktu mulai
  └─ Tekan Finish → sistem set waktu selesai
  └─ Isi QTY (wajib, > 0)
  └─ Isi NG (jika ada → pilih Kategori NG)
  └─ Simpan Laporan -> dashboard admin otomatis update tanpa refresh

TV Display
  └─ Buka /display/[landId] di browser TV
  └─ Operator kirim dokumen → tampil otomatis realtime
```

---

## 📖 Dokumentasi Lengkap

| File | Keterangan |
|---|---|
| [docs/INSTALLATION.md](./docs/INSTALLATION.md) | Setup database lengkap & storage bucket |
| [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) | Panduan Admin, Operator & TV Display |
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | Referensi semua API endpoint |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Panduan deploy ke Vercel & konfigurasi RLS produksi |

### 🔗 Dokumentasi Integrasi Supabase (Template)

Dokumentasi tambahan terkait template integrasi database cloud Supabase dapat ditemukan di folder [docs/supabase-integration/](./docs/supabase-integration/):
- [START_HERE.md](./docs/supabase-integration/START_HERE.md) — Alur awal & orientasi integrasi.
- [QUICK_REFERENCE.md](./docs/supabase-integration/QUICK_REFERENCE.md) — Panduan cepat penggunaan.
- [SETUP_GUIDE.md](./docs/supabase-integration/SETUP_GUIDE.md) — Langkah-langkah detail setup & troubleshooting.
- [IMPLEMENTATION_SUMMARY.md](./docs/supabase-integration/IMPLEMENTATION_SUMMARY.md) — Rangkuman teknis & database schema.
- [SUPABASE_INTEGRATION_README.md](./docs/supabase-integration/SUPABASE_INTEGRATION_README.md) — Gambaran arsitektur integrasi.
- [VERIFICATION_CHECKLIST.md](./docs/supabase-integration/VERIFICATION_CHECKLIST.md) — Checklist verifikasi fitur.


---

## 🗄️ Skema Database (Ringkasan)

| Tabel | Keterangan |
|---|---|
| `lands` | Lini produksi (500T, 800T, dsb.) |
| `folders` | Folder hierarkis per lini |
| `documents` | Dokumen kerja (SOP, Manual, Form) |
| `categories` | Kategori dokumen |
| `land_display_documents` | Dokumen aktif yang sedang ditampilkan TV Display |
| `production_reports` | Laporan produksi harian operator |
| `part_numbers` | Daftar part number yang dapat dipilih |
| `ng_categories` | Kategori cacat (NG) yang dapat dipilih operator |
| `profiles` | Profil user + role (admin/operator) |

---

## 🔐 Autentikasi & Akses

Sistem menggunakan **Supabase Auth** dengan RBAC berbasis role:

| Role | Akses |
|---|---|
| `admin` | Semua halaman (workspace, laporan, manajemen part number & kategori NG) |
| `operator` | Halaman operator (tampilkan dokumen + isi laporan produksi) |
| *(tanpa login)* | TV Display (`/display/[landId]`) — read-only |

---

## 📝 Lisensi

© 2026 PT FUTABA. Internal use only — all rights reserved.
