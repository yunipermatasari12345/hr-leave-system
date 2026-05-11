-- Lampiran disimpan di DB (serverless/Vercel tidak punya disk persisten)
ALTER TABLE leave_requests
    ADD COLUMN IF NOT EXISTS attachment_data BYTEA,
    ADD COLUMN IF NOT EXISTS attachment_content_type VARCHAR(128),
    ADD COLUMN IF NOT EXISTS attachment_filename VARCHAR(255);
