-- name: CreateLeaveRequest :one
INSERT INTO leave_requests (
  employee_id, leave_type_id, start_date, end_date, total_days, reason,
  attachment_url, attachment_data, attachment_content_type, attachment_filename
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetLeaveRequestsByEmployee :many
SELECT
  lr.id,
  lr.employee_id,
  lr.leave_type_id,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.reason,
  lr.status,
  lr.hrd_note,
  lr.reviewed_by,
  lr.created_at,
  lr.attachment_url,
  lr.attachment_content_type,
  lr.attachment_filename,
  (lr.attachment_data IS NOT NULL AND octet_length(lr.attachment_data) > 0) AS has_binary_attachment
FROM leave_requests lr
WHERE lr.employee_id = $1
ORDER BY lr.created_at DESC;

-- name: GetAllLeaveRequests :many
SELECT 
  lr.id,
  lr.employee_id,
  lr.leave_type_id,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.reason,
  lr.attachment_url,
  (lr.attachment_data IS NOT NULL AND octet_length(lr.attachment_data) > 0) AS has_binary_attachment,
  lr.status,
  lr.hrd_note,
  lr.reviewed_by,
  lr.created_at,
  e.full_name as employee_name,
  e.department as employee_department,
  e.position as employee_position
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
ORDER BY lr.created_at DESC;

-- name: GetLeaveRequestByID :one
SELECT * FROM leave_requests
WHERE id = $1 LIMIT 1;

-- name: GetLeaveAttachmentByID :one
SELECT attachment_data, attachment_content_type, attachment_filename, employee_id
FROM leave_requests
WHERE id = $1
LIMIT 1;

-- name: UpdateLeaveRequestStatus :one
UPDATE leave_requests
SET status = $2, hrd_note = $3, reviewed_by = $4
WHERE id = $1
RETURNING *;

-- name: GetLeaveBalance :many
SELECT * FROM leave_balances
WHERE employee_id = $1 AND year = $2;

-- name: UpdateLeaveBalance :one
UPDATE leave_balances
SET used_days = used_days + $2,
    remaining_days = remaining_days - $2
WHERE employee_id = $1 AND leave_type_id = $3 AND year = $4
RETURNING *;

-- name: GetAllLeaveTypes :many
SELECT * FROM leave_types;