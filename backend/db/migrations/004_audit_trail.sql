-- Tabel untuk merekam jejak audit (Audit Trail)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Boleh null karena ada request dari user yang belum login
    action TEXT NOT NULL,
    path TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
