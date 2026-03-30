package persistence

import (
	"context"
	"database/sql"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/employee"
)

type employeeRepository struct {
	q *db.Queries
}

func NewEmployeeRepository(raw *sql.DB) employee.Repository {
	return &employeeRepository{q: db.New(raw)}
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
	return r.q.DeleteEmployee(ctx, id)
}
