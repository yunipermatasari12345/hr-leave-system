-- name: LogAudit :one
INSERT INTO audit_logs (
    user_id,
    action,
    path,
    ip_address
) VALUES (
    $1, $2, $3, $4
) RETURNING id, user_id, action, path, ip_address, created_at;
