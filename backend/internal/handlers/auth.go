package handlers

import (
	"encoding/json"
	"errors"
	"hr-leave-system/internal/application"
	"net/http"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
	Name  string `json:"name"`
}

type CreateEmployeeRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	json.NewDecoder(r.Body).Decode(&req)

	out, err := AuthService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, application.ErrValidation) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Email dan password wajib diisi"})
			return
		}
		if errors.Is(err, application.ErrUnauthorized) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Email atau password salah"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat token"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token: out.Token,
		Role:  out.Role,
		Name:  out.Name,
	})
}

func CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req CreateEmployeeRequest
	json.NewDecoder(r.Body).Decode(&req)

	emp, err := AuthService.CreateEmployeeAccount(r.Context(), req.Email, req.Password, req.FullName, req.Department, req.Position, req.Phone)
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
