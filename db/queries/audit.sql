-- name: LogAudit :one
INSERT INTO audit_logs (
    user_id,
    action,
    path,
    ip_address
) VALUES (
    $1, $2, $3, $4
) RETURNING id, user_id, action, path, ip_address, created_at;

-- name: GetAuditLogs :many
SELECT 
    al.id, 
    al.user_id, 
    COALESCE(e.full_name, 'System/Guest')::TEXT AS full_name,
    COALESCE(u.email, '-')::TEXT AS email,
    al.action, 
    al.path, 
    al.ip_address, 
    al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN employees e ON al.user_id = e.user_id
ORDER BY al.created_at DESC
LIMIT 100;
