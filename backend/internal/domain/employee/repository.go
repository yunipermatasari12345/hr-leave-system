package employee

import "context"

type Repository interface {
	GetByUserID(ctx context.Context, userID int32) (Employee, error)
	GetByID(ctx context.Context, id int32) (Employee, error)
	List(ctx context.Context) ([]Employee, error)
	Create(ctx context.Context, userID int32, fullName, department, position, phone string) (Employee, error)
	Update(ctx context.Context, id int32, fullName, department, position, phone string) (Employee, error)
	Delete(ctx context.Context, id int32) error
}
