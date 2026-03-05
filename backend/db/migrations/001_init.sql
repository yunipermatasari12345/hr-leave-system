-- Tabel users (untuk login)
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel employees (data karyawan)
CREATE TABLE employees (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    full_name  TEXT NOT NULL,
    department TEXT NOT NULL,
    position   TEXT NOT NULL,
    phone      TEXT,
    joined_at  TIMESTAMP DEFAULT NOW()
);

-- Tabel jenis cuti
CREATE TABLE leave_types (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    max_days    INTEGER NOT NULL,
    description TEXT
);

-- Tabel saldo cuti karyawan
CREATE TABLE leave_balances (
    id             SERIAL PRIMARY KEY,
    employee_id    INTEGER NOT NULL REFERENCES employees(id),
    leave_type_id  INTEGER NOT NULL REFERENCES leave_types(id),
    year           INTEGER NOT NULL,
    total_days     INTEGER NOT NULL,
    used_days      INTEGER NOT NULL DEFAULT 0,
    remaining_days INTEGER NOT NULL
);

-- Tabel pengajuan cuti
CREATE TABLE leave_requests (
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id),
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    total_days    INTEGER NOT NULL,
    reason        TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    hrd_note      TEXT,
    reviewed_by   INTEGER REFERENCES employees(id),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Tabel notifikasi
CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert jenis cuti default
INSERT INTO leave_types (name, max_days, description) VALUES
('Cuti Tahunan', 12, 'Cuti tahunan reguler'),
('Cuti Sakit', 14, 'Cuti karena sakit dengan surat dokter'),
('Cuti Melahirkan', 90, 'Cuti untuk karyawan melahirkan'),
('Cuti Menikah', 3, 'Cuti untuk pernikahan'),
('Cuti Darurat', 3, 'Cuti untuk keperluan darurat');