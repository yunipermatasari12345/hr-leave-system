-- Tabel untuk Master Departemen
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Tabel untuk Master Jabatan
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1
);

-- Migrasi data awal ke master departemen & jabatan (dari data statis karyawan yang sudah ada)
INSERT INTO departments (name) SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO positions (name) SELECT DISTINCT position FROM employees WHERE position IS NOT NULL ON CONFLICT DO NOTHING;

-- Opsional: kalau mau update foreign key, idealnya bikin kolom baru tapi untuk kesederhanaan,
-- Di API Golang kita tetap pertahankan return string untuk kemudahan UI,
-- namun kita sediakan tabel ini untuk keperluan Master Data UI.
-- Master data 'departments' dan 'positions' difokuskan untuk dropdown di form Create/Edit Karyawan.

-- Tabel Histori Persetujuan Cuti (Untuk fitur "Riwayat Keputusan")
CREATE TABLE leave_histories (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL,          -- 'approved', 'rejected'
    hrd_note TEXT,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
