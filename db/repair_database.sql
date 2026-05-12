-- REPAIR SCRIPT FOR HR LEAVE SYSTEM
-- Jalankan ini di SQL Editor Neon untuk memastikan skema database lengkap.

-- 1. Pastikan kolom lampiran ada di leave_requests
ALTER TABLE leave_requests 
    ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS attachment_data BYTEA,
    ADD COLUMN IF NOT EXISTS attachment_content_type VARCHAR(128),
    ADD COLUMN IF NOT EXISTS attachment_filename VARCHAR(255);

-- 2. Pastikan tabel audit_logs ada
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action TEXT NOT NULL,
    path TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Pastikan tabel leave_histories ada (Fitur Enterprise)
CREATE TABLE IF NOT EXISTS leave_histories (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    hrd_note TEXT,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Pastikan tabel Master Departemen & Jabatan ada
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1
);

-- 5. Migrasi data awal jika kosong
INSERT INTO departments (name) 
SELECT DISTINCT department FROM employees 
WHERE department IS NOT NULL 
ON CONFLICT DO NOTHING;

INSERT INTO positions (name) 
SELECT DISTINCT position FROM employees 
WHERE position IS NOT NULL 
ON CONFLICT DO NOTHING;

-- 6. Pastikan jenis cuti default tersedia
INSERT INTO leave_types (name, max_days, description) 
SELECT name, max_days, description FROM (
    VALUES 
    ('Cuti Tahunan', 12, 'Cuti tahunan reguler'),
    ('Cuti Sakit', 14, 'Cuti karena sakit dengan surat dokter'),
    ('Cuti Melahirkan', 20, 'Cuti untuk karyawan melahirkan'),
    ('Cuti Menikah', 5, 'Cuti untuk pernikahan'),
    ('Cuti Darurat', 3, 'Cuti untuk keperluan darurat')
) AS t(name, max_days, description)
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_types.name = t.name);

-- 7. (PENTING) Jika user ini (Anda) belum bisa ajukan cuti, mungkin karena data employee belum ada.
-- Jalankan query di bawah ini SECARA MANUAL jika Anda masih melihat error "Data karyawan tidak ditemukan".
-- Ganti 'EMAIL_ANDA' dengan email yang Anda gunakan untuk login.
/*
INSERT INTO employees (user_id, full_name, department, position)
SELECT id, 'Karyawan Baru', 'Grup Umum', 'Staff'
FROM users WHERE email = 'EMAIL_ANDA'
AND NOT EXISTS (SELECT 1 FROM employees WHERE user_id = users.id);
*/
