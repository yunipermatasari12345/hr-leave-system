package application

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
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

// Login memverifikasi email & password via Appskep API lalu mengembalikan JWT token lokal
func (s *AuthService) Login(ctx context.Context, email, password string) (AuthOutput, error) {
	fmt.Printf("--- MENCOBA LOGIN UNTUK: %s ---\n", email)
	if email == "" || password == "" {
		return AuthOutput{}, ErrValidation
	}

	// 1. Verifikasi ke API Appskep Kantor (External)
	// Kita lakukan via server-to-server untuk menghindari blokir Cloudflare di browser
	appskepURL := "https://dev-base.appskep.id/api/login"
	loginData := map[string]string{
		"email":    email,
		"password": password,
	}
	jsonData, _ := json.Marshal(loginData)

	req, _ := http.NewRequestWithContext(ctx, "POST", appskepURL, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Origin", "https://dev-base.appskep.id")
	req.Header.Set("Referer", "https://dev-base.appskep.id/")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Appskep Connection Error: %v", err)
		return AuthOutput{}, fmt.Errorf("failed to connect to Appskep API: %w", err)
	}
	defer resp.Body.Close()

	// 2. Cek apakah email terdaftar di sistem HR lokal (Neon)
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	u, err := s.users.GetByEmail(ctx, normalizedEmail)
	if err != nil {
		fmt.Printf("[DEBUG] User not found in local DB: %s\n", normalizedEmail)
		return AuthOutput{}, errors.New("email registered in Appskep but not in HR system")
	}

	// Baca body untuk debugging jika gagal
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("[DEBUG] Appskep Response Status: %d\n", resp.StatusCode)
	
	// Jika gagal di Appskep, kita coba fallback ke password lokal di DB Neon
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("[DEBUG] Appskep rejected. Attempting local DB fallback for: %s\n", normalizedEmail)
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
			fmt.Printf("[DEBUG] Local DB fallback also failed (wrong password).\n")
			return AuthOutput{}, ErrUnauthorized
		}
		fmt.Printf("[DEBUG] Local DB fallback SUCCESS!\n")
	}

	// 3. Generate token lokal kita sendiri
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
