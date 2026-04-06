package application

import (
	"context"
	"strings"
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

func NewAuthService(users user.Repository, employees employee.Repository, jwtSecret []byte) *AuthService {
	return &AuthService{
		users:     users,
		employees: employees,
		jwtSecret: jwtSecret,
	}
}

// AuthOutput adalah hasil dari Login / GenerateTokenByEmail
type AuthOutput struct {
	Token      string
	Role       string
	Name       string
	Department string
	Position   string
}

// Login memverifikasi email & password lalu mengembalikan JWT token
func (s *AuthService) Login(ctx context.Context, email, password string) (AuthOutput, error) {
	if email == "" || password == "" {
		return AuthOutput{}, ErrValidation
	}

	u, err := s.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return AuthOutput{}, ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return AuthOutput{}, ErrUnauthorized
	}

	token, err := s.generateToken(u.ID, u.Role)
	if err != nil {
		return AuthOutput{}, err
	}

	var name, department, position string
	emp, err := s.employees.GetByUserID(ctx, u.ID)
	if err == nil {
		name = emp.FullName
		department = emp.Department
		position = emp.Position
	}

	return AuthOutput{
		Token:      token,
		Role:       u.Role,
		Name:       name,
		Department: department,
		Position:   position,
	}, nil
}

// CreateEmployeeAccount membuat akun user + data karyawan sekaligus
// Tidak membutuhkan password karena login menggunakan Appskep API (eksternal)
func (s *AuthService) CreateEmployeeAccount(ctx context.Context, email, fullName, department, position, phone, role string) (employee.Employee, error) {
	if email == "" || fullName == "" {
		return employee.Employee{}, ErrValidation
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	// Cek apakah email sudah ada
	if _, err := s.users.GetByEmail(ctx, normalizedEmail); err == nil {
		return employee.Employee{}, ErrEmailTaken
	}

	if role == "" {
		role = "employee"
	}

	// Simpan tanpa password karena autentikasi dilakukan via Appskep API
	u, err := s.users.Create(ctx, normalizedEmail, "", role)
	if err != nil {
		return employee.Employee{}, err
	}

	// Buat employee
	emp, err := s.employees.Create(ctx, u.ID, fullName, department, position, phone)
	if err != nil {
		return employee.Employee{}, err
	}

	emp.Email = normalizedEmail
	emp.Role = role
	return emp, nil
}

// IsEmailRegistered mengecek apakah email sudah terdaftar di sistem lokal
func (s *AuthService) IsEmailRegistered(ctx context.Context, email string) (bool, string, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	u, err := s.users.GetByEmail(ctx, normalizedEmail)
	if err != nil {
		return false, "", nil
	}
	return true, u.Role, nil
}

// GenerateTokenByEmail langsung generate token berdasarkan email (tanpa verifikasi password)
func (s *AuthService) GenerateTokenByEmail(ctx context.Context, email string) (AuthOutput, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	u, err := s.users.GetByEmail(ctx, normalizedEmail)
	if err != nil {
		return AuthOutput{}, ErrUnauthorized
	}

	token, err := s.generateToken(u.ID, u.Role)
	if err != nil {
		return AuthOutput{}, err
	}

	var name, department, position string
	emp, err := s.employees.GetByUserID(ctx, u.ID)
	if err == nil {
		name = emp.FullName
		department = emp.Department
		position = emp.Position
	}

	return AuthOutput{
		Token:      token,
		Role:       u.Role,
		Name:       name,
		Department: department,
		Position:   position,
	}, nil
}

// generateToken adalah helper internal untuk membuat JWT
func (s *AuthService) generateToken(userID int32, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
