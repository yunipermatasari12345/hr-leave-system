-- name: CreateNotification :one
INSERT INTO notifications (user_id, message)
VALUES ($1, $2)
RETURNING *;

-- name: GetNotificationsByUser :many
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: MarkNotificationRead :one
UPDATE notifications
SET is_read = TRUE
WHERE id = $1
RETURNING *;

-- name: CountUnreadNotifications :one
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND is_read = FALSE;