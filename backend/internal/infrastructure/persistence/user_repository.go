package persistence

import (
	"context"
	"database/sql"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/user"
)

type userRepository struct {
	q *db.Queries
}

func NewUserRepository(raw *sql.DB) user.Repository {
	return &userRepository{q: db.New(raw)}
}

func userFromDB(u db.User) user.User {
	return user.User{
		ID:           u.ID,
		Email:        u.Email,
		PasswordHash: u.Password,
		Role:         u.Role,
	}
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (user.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return user.User{}, err
	}
	return userFromDB(row), nil
}

func (r *userRepository) GetByID(ctx context.Context, id int32) (user.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return user.User{}, err
	}
	return userFromDB(row), nil
}

func (r *userRepository) Create(ctx context.Context, email, passwordHash, role string) (user.User, error) {
	row, err := r.q.CreateUser(ctx, db.CreateUserParams{
		Email:    email,
		Password: passwordHash,
		Role:     role,
	})
	if err != nil {
		return user.User{}, err
	}
	return userFromDB(row), nil
}
