package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"hr-leave-system/internal/application"
	"io"
	"net/http"
	"time"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token      string `json:"token"`
	Role       string `json:"role"`
	Name       string `json:"name"`
	Department string `json:"department"`
	Position   string `json:"position"`
}

type CreateEmployeeRequest struct {
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
	Role       string `json:"role"`
}

type VerifyRequest struct {
	Email string `json:"email"`
}

type VerifyResponse struct {
	IsRegistered bool   `json:"is_registered"`
	Role         string `json:"role"`
	Token        string `json:"token"`
	Name         string `json:"name"`
	Department   string `json:"department"`
	Position     string `json:"position"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	bodyBytes, _ := io.ReadAll(r.Body)
	json.Unmarshal(bodyBytes, &req)

	// Call External Appskep API
	appskepURL := "https://dev-base.appskep.id/api/login"
	appskepReq, _ := http.NewRequest("POST", appskepURL, bytes.NewBuffer(bodyBytes))
	appskepReq.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(appskepReq)
	
	// Jika gagal di sisi Appskep, berarti email/password salah
	if err != nil || resp.StatusCode != http.StatusOK {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Login ke Appskep gagal. Periksa kembali email dan password."})
		return
	}

	// Login ke Appskep SUKSES! 
	// Sekarang kita cek apakah email tersebut terdaftar di database HR lokal kita (Neon)
	isRegistered, role, _ := AuthService.IsEmailRegistered(r.Context(), req.Email)
	if !isRegistered {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Akun Appskep valid, tapi belum terdaftar di sistem HR lokal."})
		return
	}

	// Email terdaftar! Kita berikan Token Lokal untuk akses aplikasi HR kita
	out, err := AuthService.GenerateTokenByEmail(r.Context(), req.Email)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat token lokal"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token:      out.Token,
		Role:       role,
		Name:       out.Name,
		Department: out.Department,
		Position:   out.Position,
	})
}

func CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req CreateEmployeeRequest
	json.NewDecoder(r.Body).Decode(&req)

	emp, err := AuthService.CreateEmployeeAccount(r.Context(), req.Email, req.FullName, req.Department, req.Position, req.Phone, req.Role)
	if err != nil {
		if errors.Is(err, application.ErrValidation) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Email, password, dan nama wajib diisi"})
			return
		}
		if errors.Is(err, application.ErrEmailTaken) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Email sudah digunakan"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat data karyawan"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

func VerifyRegistration(w http.ResponseWriter, r *http.Request) {
	var req VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	isRegistered, role, _ := AuthService.IsEmailRegistered(r.Context(), req.Email)

	var localToken string
	var name, department, position string
	if isRegistered {
		res, _ := AuthService.GenerateTokenByEmail(r.Context(), req.Email)
		localToken = res.Token
		name = res.Name
		department = res.Department
		position = res.Position
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(VerifyResponse{
		IsRegistered: isRegistered,
		Role:         role,
		Token:        localToken,
		Name:         name,
		Department:   department,
		Position:     position,
	})
}
