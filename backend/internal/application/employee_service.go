package application

import (
	"context"

	"hr-leave-system/internal/domain/employee"
)

type EmployeeService struct {
	employees employee.Repository
}

func NewEmployeeService(employees employee.Repository) *EmployeeService {
	return &EmployeeService{employees: employees}
}

func (s *EmployeeService) List(ctx context.Context) ([]employee.Employee, error) {
	list, err := s.employees.List(ctx)
	if err != nil {
		return []employee.Employee{}, nil
	}
	return list, nil
}

func (s *EmployeeService) Update(ctx context.Context, id int32, fullName, department, position, phone, role string) (employee.Employee, error) {
	return s.employees.Update(ctx, id, fullName, department, position, phone, role)
}

func (s *EmployeeService) Delete(ctx context.Context, id int32) error {
	return s.employees.Delete(ctx, id)
}
