# 🔌 Referensi API (API Reference)

Dokumen ini mendokumentasikan API Endpoints yang tersedia pada aplikasi **Futaba Digital Document Management System** untuk interaksi antara frontend, backend, dan database Supabase.

---

## 🗂️ Kategori Dokumen (Categories)

### 1. GET `/api/categories`
Mengambil seluruh daftar kategori dokumen yang terdaftar.

- **Method**: `GET`
- **Request Parameters**: Tidak ada
- **Response (200 OK)**:
  ```json
  [
    { "id": 1, "name": "SOP", "description": "Standard Operating Procedures" },
    { "id": 2, "name": "Manual", "description": "User Manuals and Guides" },
    { "id": 3, "name": "Form", "description": "Forms and Templates" },
    { "id": 4, "name": "Lainnya", "description": "Other Documents" }
  ]
  ```

---

## 📄 Dokumen (Documents)

### 1. GET `/api/documents`
Mengambil daftar berkas dokumen berdasarkan filter Land, Folder, atau kueri pencarian.

- **Method**: `GET`
- **Query Parameters**:
  - `landId` (string, opsional): ID Land untuk menyaring dokumen.
  - `folderId` (number, opsional): ID folder spesifik. Jika diabaikan atau diset null, mengambil dokumen dari root Land.
  - `search` (string, opsional): Kata kunci pencarian (judul, deskripsi, atau nama file).
  - `includeHidden` (boolean, opsional): Set `true` untuk menyertakan dokumen yang disembunyikan dari operator (default: `false`).
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "2d8f9a2e-4b2a-4a2e-8c3b-5d6e7f8a9b0c",
      "title": "SOP Perakitan Awal",
      "description": "Prosedur standar perakitan mesin tahap awal",
      "category": "SOP",
      "type": "application/pdf",
      "file": {
        "name": "sop-perakitan-v2.pdf",
        "path": "documents/1720000000-sop-perakitan-v2.pdf",
        "size": 1048576
      },
      "targetTime": "2026-07-15T08:00:00.000Z",
      "hiddenFromOperator": false
    }
  ]
  ```

### 2. PATCH `/api/documents/[id]`
Memperbarui metadata dokumen tertentu (seperti target waktu, visibilitas operator, nama file, atau judul dokumen).

- **Method**: `PATCH`
- **Path Parameters**:
  - `id` (UUID, wajib): ID dokumen yang akan diupdate.
- **Request Body (JSON)**:
  - `target_time` (string | null, opsional): Tanggal & waktu target berformat ISO 8601.
  - `hidden_from_operator` (boolean, opsional): Menentukan apakah dokumen disembunyikan dari operator.
  - `file_name` (string, opsional): Mengubah nama file asli (misal: `perbaikan-manual.pdf`).
  - `title` (string, opsional): Mengubah judul dokumen (misal: `SOP Perbaikan Mesin`).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document": {
      "id": "2d8f9a2e-4b2a-4a2e-8c3b-5d6e7f8a9b0c",
      "targetTime": "2026-07-15T08:00:00.000Z",
      "hiddenFromOperator": false,
      "fileName": "perbaikan-manual.pdf",
      "title": "SOP Perbaikan Mesin"
    }
  }
  ```

### 3. DELETE `/api/documents/[id]`
Menghapus rekaman dokumen dari database PostgreSQL dan menghapus file fisiknya dari Supabase Storage bucket.

- **Method**: `DELETE`
- **Path Parameters**:
  - `id` (UUID, wajib): ID dokumen yang ingin dihapus.
- **Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

---

## 📂 Folder (Folders)

### 1. GET `/api/folders`
Mengambil daftar folder kerja pada Land atau subfolder tertentu.

- **Method**: `GET`
- **Query Parameters**:
  - `landId` (string, wajib): Menyaring folder berdasarkan ID Land.
  - `parentId` (number, opsional): ID folder induk untuk mencari subfolder. Jika diabaikan, mengambil folder di root Land.
  - `search` (string, opsional): Kata kunci pencarian nama folder.
  - `includeAll` (boolean, opsional): Mengabaikan filter tingkat kedalaman folder jika diset `true`.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 12,
      "name": "Instruksi Kerja",
      "parent_id": null,
      "item_count": 3
    }
  ]
  ```

---

## 💾 Upload & Download File (Storage Helpers)

### 1. POST `/api/upload`
Mengunggah file ke Supabase Storage dan membuat record dokumen secara atomik di database.

- **Method**: `POST`
- **Request Body (`multipart/form-data`)**:
  - `file` (File, wajib): Berkas dokumen (PDF, JPG, PNG). Ukuran maks 50MB.
  - `title` (string, wajib): Judul dokumen.
  - `description` (string, opsional): Keterangan dokumen.
  - `landId` (string, wajib): ID Land tempat dokumen diunggah.
  - `folderId` (number, opsional): ID folder tujuan.
  - `targetTime` (string, opsional): Target waktu (format ISO string).
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Document uploaded successfully",
    "document": {
      "id": "2d8f9a2e-4b2a-4a2e-8c3b-5d6e7f8a9b0c",
      "title": "SOP Perakitan Awal",
      "description": "Prosedur standar perakitan mesin tahap awal",
      "file_name": "sop-perakitan-v2.pdf",
      "file_path": "documents/1720000000-sop-perakitan-v2.pdf",
      "file_size": 1048576,
      "file_type": "application/pdf"
    }
  }
  ```

### 2. POST `/api/download`
Menghasilkan Signed URL yang aman untuk melihat atau mengunduh berkas dari Supabase Storage. URL yang dihasilkan hanya berlaku selama 1 jam demi alasan keamanan berkas.

- **Method**: `POST`
- **Request Body (JSON)**:
  - `filePath` (string, wajib): Path relatif file di storage bucket (misal: `documents/1720000000-file.pdf`).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "url": "https://tptvrxybbyficbiypwgn.supabase.co/storage/v1/object/sign/documents/documents/1720000000-file.pdf?token=..."
  }
  ```
