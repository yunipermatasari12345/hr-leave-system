package user

import "context"

type Repository interface {
	GetByEmail(ctx context.Context, email string) (User, error)
	GetByID(ctx context.Context, id int32) (User, error)
	Create(ctx context.Context, email, passwordHash, role string) (User, error)
}
