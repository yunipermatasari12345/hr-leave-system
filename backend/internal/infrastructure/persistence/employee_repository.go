package persistence

import (
	"context"
	"database/sql"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/employee"
)

type employeeRepository struct {
	q  *db.Queries
	db *sql.DB
}

func NewEmployeeRepository(raw *sql.DB) employee.Repository {
	return &employeeRepository{q: db.New(raw), db: raw}
}

func employeeFromDB(e db.Employee) employee.Employee {
	out := employee.Employee{
		ID:         e.ID,
		UserID:     e.UserID,
		FullName:   e.FullName,
		Department: e.Department,
		Position:   e.Position,
	}
	if e.Phone.Valid {
		out.Phone = e.Phone.String
	}
	return out
}

func (r *employeeRepository) GetByUserID(ctx context.Context, userID int32) (employee.Employee, error) {
	row, err := r.q.GetEmployeeByUserID(ctx, userID)
	if err != nil {
		return employee.Employee{}, err
	}
	return employeeFromDB(row), nil
}

func (r *employeeRepository) GetByID(ctx context.Context, id int32) (employee.Employee, error) {
	row, err := r.q.GetEmployeeByID(ctx, id)
	if err != nil {
		return employee.Employee{}, err
	}
	return employeeFromDB(row), nil
}

func (r *employeeRepository) List(ctx context.Context) ([]employee.Employee, error) {
	rows, err := r.q.GetAllEmployees(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]employee.Employee, len(rows))
	for i := range rows {
		out[i] = employeeFromDB(rows[i])
	}
	return out, nil
}

func (r *employeeRepository) Create(ctx context.Context, userID int32, fullName, department, position, phone string) (employee.Employee, error) {
	row, err := r.q.CreateEmployee(ctx, db.CreateEmployeeParams{
		UserID:     userID,
		FullName:   fullName,
		Department: department,
		Position:   position,
		Phone: sql.NullString{
			String: phone,
			Valid:  phone != "",
		},
	})
	if err != nil {
		return employee.Employee{}, err
	}
	return employeeFromDB(row), nil
}

func (r *employeeRepository) Update(ctx context.Context, id int32, fullName, department, position, phone string) (employee.Employee, error) {
	row, err := r.q.UpdateEmployee(ctx, db.UpdateEmployeeParams{
		ID:         id,
		FullName:   fullName,
		Department: department,
		Position:   position,
		Phone: sql.NullString{
			String: phone,
			Valid:  phone != "",
		},
	})
	if err != nil {
		return employee.Employee{}, err
	}
	return employeeFromDB(row), nil
}

func (r *employeeRepository) Delete(ctx context.Context, id int32) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx.Rollback()

	// Ambil user_id dari employee
	var userID int32
	err = tx.QueryRowContext(ctx, "SELECT user_id FROM employees WHERE id = $1", id).Scan(&userID)
	if err != nil { return err }

	// Hapus notifications user ini
	if _, err := tx.ExecContext(ctx, "DELETE FROM notifications WHERE user_id = $1", userID); err != nil { return err }

	// Update leave_requests di mana employee ini bertindak sebagai reviewer menjadi NULL
	if _, err := tx.ExecContext(ctx, "UPDATE leave_requests SET reviewed_by = NULL WHERE reviewed_by = $1", id); err != nil { return err }

	// Hapus history, requests, balances
	if _, err := tx.ExecContext(ctx, "DELETE FROM leave_histories WHERE leave_request_id IN (SELECT id FROM leave_requests WHERE employee_id = $1)", id); err != nil { return err }
	if _, err := tx.ExecContext(ctx, "DELETE FROM leave_requests WHERE employee_id = $1", id); err != nil { return err }
	if _, err := tx.ExecContext(ctx, "DELETE FROM leave_balances WHERE employee_id = $1", id); err != nil { return err }
	
	// Set null untuk user di tabel leave_histories supaya tidak FK constraint
	if _, err := tx.ExecContext(ctx, "UPDATE leave_histories SET actor_id = NULL WHERE actor_id = $1", userID); err != nil { return err }

	// Hapus employee itu sendiri
	if _, err := tx.ExecContext(ctx, "DELETE FROM employees WHERE id = $1", id); err != nil { return err }

	// Hapus user di tabel users untuk membersihkan akses otentikasi
	if _, err := tx.ExecContext(ctx, "DELETE FROM users WHERE id = $1", userID); err != nil { return err }

	return tx.Commit()
}
