-- name: GetDashboardStats :one
SELECT 
  (SELECT COUNT(*) FROM employees) AS total_employees,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending' AND DATE(created_at) = CURRENT_DATE) AS pending_today,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'approved') AS total_approved,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS total_pending,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'rejected') AS total_rejected;

-- name: GetMonthlyLeaveStats :many
SELECT 
  TO_CHAR(start_date, 'YYYY-MM') AS month,
  COUNT(*) AS total
FROM leave_requests
WHERE status = 'approved' AND start_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1;

-- name: GetAdvancedLeaves :many
SELECT 
  lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, lr.total_days,
  lr.reason, lr.attachment_url, lr.status, lr.hrd_note, lr.reviewed_by, lr.created_at,
  e.full_name as employee_name, e.department as employee_department, e.position as employee_position
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE 
  ($1::text = '' OR lr.status = $1)
  AND ($2::text = '' OR e.department = $2)
ORDER BY lr.created_at DESC;

-- name: GetDepartments :many
SELECT * FROM departments ORDER BY name ASC;

-- name: CreateDepartment :one
INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *;

-- name: GetPositions :many
SELECT * FROM positions ORDER BY level ASC, name ASC;

-- name: CreatePosition :one
INSERT INTO positions (name, level) VALUES ($1, $2) RETURNING *;

-- name: CreateLeaveType :one
INSERT INTO leave_types (name, max_days, description) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateLeaveType :one
UPDATE leave_types SET name = $2, max_days = $3, description = $4 WHERE id = $1 RETURNING *;

-- name: DeleteLeaveType :exec
DELETE FROM leave_types WHERE id = $1;

-- name: UpdateEmployee :one
UPDATE employees SET full_name = $2, department = $3, position = $4, phone = $5 WHERE id = $1 RETURNING *;

-- name: DeleteEmployee :exec
DELETE FROM employees WHERE id = $1;

-- name: InsertLeaveHistory :one
INSERT INTO leave_histories (leave_request_id, action, hrd_note, actor_id)
VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetLeaveHistories :many
SELECT lh.id, lh.leave_request_id, lh.action, lh.hrd_note, lh.actor_id, lh.created_at, u.email as actor_email 
FROM leave_histories lh
JOIN users u ON lh.actor_id = u.id
WHERE lh.leave_request_id = $1
ORDER BY lh.created_at DESC;

-- name: GetLeaveRecapPerDepartment :many
SELECT 
  e.department,
  COUNT(lr.id) AS total_leaves,
  SUM(lr.total_days)::int AS total_days
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE lr.status = 'approved'
GROUP BY e.department
ORDER BY total_leaves DESC;
