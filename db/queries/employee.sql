-- name: GetEmployeeByUserID :one
SELECT * FROM employees
WHERE user_id = $1 LIMIT 1;

-- name: GetAllEmployees :many
SELECT * FROM employees;

-- name: GetEmployeeByID :one
SELECT * FROM employees
WHERE id = $1 LIMIT 1;

-- name: CreateEmployee :one
INSERT INTO employees (user_id, full_name, department, position, phone)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;