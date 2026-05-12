# Panduan Neon baru (Singapura) + Vercel — koneksi stabil

Gejala **hilang-timbul** / harus refresh sering muncul karena: **latensi jauh ke DB**, **compute Neon sedang sleep**, atau **bukan connection string pooler** untuk serverless.

## 1. Buat project Neon baru (region Singapura)

1. Buka [Neon Console](https://console.neon.tech) → **Create project**.
2. **Region**: pilih **AWS Asia Pacific (Singapore)** (`aws-ap-southeast-1`).
3. Setelah jadi, buka **Connection details**.

## 2. Connection string yang benar untuk Vercel

- Pilih mode **Pooled** / **Transaction** (bukan hanya “Direct” mentah untuk traffic aplikasi).
- Host biasanya mengandung **`ep-…-pooler.`** (ada kata **pooler**).
- Salin string yang sudah ada `sslmode=require` (atau biarkan kode menambah default untuk host `neon.tech`).

Tanpa pooler, function serverless bisa membuka terlalu banyak koneksi ke Postgres dan terasa tidak stabil.

## 3. Skema database (project baru kosong)

Jalankan file SQL **berurutan** pada database baru (SQL Editor Neon atau `psql`):

| Urutan | File |
|--------|------|
| 1 | `db/migrations/001_init.sql` |
| 2 | `db/migrations/002_enterprise_features.sql` |
| 3 | `db/migrations/003_add_attachment.sql` |
| 4 | `db/migrations/004_audit_trail.sql` |
| 5 | `db/migrations/005_leave_attachment_binary.sql` |

> Catatan: Gunakan urutan di atas; dulu audit trail, lalu lampiran BYTEA.


## 4. (Opsional) Pindahkan data dari project Neon lama

Jika perlu data lama, dari mesin yang punya `pg_dump` / `psql`:

```bash
# Ganti URL dengan connection string **direct** dari project LAMA (untuk dump)
pg_dump "postgresql://USER:PASS@ep-OLD.../neondb?sslmode=require" -Fc -f backup.dump

# Restore ke project BARU (boleh direct atau pooler; restore besar lebih aman pakai direct)
pg_restore --no-owner --no-acl -d "postgresql://USER:PASS@ep-NEW.../neondb?sslmode=require" backup.dump
```

Kalau tidak butuh data lama, cukup langkah skema (bagian 3) + buat user/admin baru lewat aplikasi.

## 5. Vercel

1. Project → **Settings** → **Environment Variables**.
2. Set **`DATABASE_URL`** = connection string **pooler** project **baru**.
3. **Redeploy** (Deployments → … → Redeploy).

Lihat juga variabel opsional di `.env.example` (`DB_MAX_OPEN_CONNS`, dll.) jika ingin menyesuaikan.

## 6. Perilaku di kode (sudah ada di repo)

File `config/config.go` sekarang:

- Menambah **`connect_timeout`** pada URL Postgres.
- Mengatur **pool** (`SetMaxOpenConns`, `SetConnMaxLifetime`, dll.) agar cocok serverless.
- **Retry ping** saat startup instance agar sedikit lebih tahan cold start / jaringan.

Ini **tidak menggantikan** pemakaian host **pooler**; keduanya saling melengkapi.

## Checklist cepat

- [ ] Project Neon region **Singapore**
- [ ] `DATABASE_URL` di Vercel = **pooled** (`-pooler` di host)
- [ ] Migrasi SQL di DB baru sudah dijalankan sesuai urutan
- [ ] Redeploy setelah ganti env
