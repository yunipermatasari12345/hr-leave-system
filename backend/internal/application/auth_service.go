package application

import (
	"context"
	"time"

	"hr-leave-system/internal/domain/employee"
	"hr-leave-system/internal/domain/user"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users     user.Repository
	employees employee.Repository
	jwtSecret []byte
}

type LoginResult struct {
	Token string
	Role  string
	Name  string
}

func NewAuthService(users user.Repository, employees employee.Repository, jwtSecret []byte) *AuthService {
	return &AuthService{
		users:     users,
		employees: employees,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthService) IsEmailRegistered(ctx context.Context, email string) (bool, string, error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return false, "", nil // Not found is not an error here, just false
	}
	return true, u.Role, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (LoginResult, error) {
	if email == "" || password == "" {
		return LoginResult{}, ErrValidation
	}
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return LoginResult{}, ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return LoginResult{}, ErrUnauthorized
	}
	name := ""
	if emp, err := s.employees.GetByUserID(ctx, u.ID); err == nil {
		name = emp.FullName
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": u.ID,
		"role":    u.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return LoginResult{}, err
	}
	return LoginResult{
		Token: tokenString,
		Role:  u.Role,
		Name:  name,
	}, nil
}

func (s *AuthService) CreateEmployeeAccount(ctx context.Context, email, password, fullName, department, position, phone string) (employee.Employee, error) {
	if email == "" || fullName == "" {
		return employee.Employee{}, ErrValidation
	}

	// Jika password kosong (karena pakai Appskep), beri placeholder
	if password == "" {
		password = "EXTERNAL_AUTH_USER"
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return employee.Employee{}, err
	}
	u, err := s.users.Create(ctx, email, string(hashed), "employee")
	if err != nil {
		return employee.Employee{}, ErrEmailTaken
	}
	emp, err := s.employees.Create(ctx, u.ID, fullName, department, position, phone)
	if err != nil {
		return employee.Employee{}, err
	}
	return emp, nil
}
