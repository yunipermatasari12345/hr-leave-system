-- +goose Up
ALTER TABLE leave_requests ADD COLUMN attachment_url VARCHAR(255);

-- +goose Down
ALTER TABLE leave_requests DROP COLUMN attachment_url;
