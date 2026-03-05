package handlers

import (
	"encoding/json"
	"hr-leave-system/config"
	db "hr-leave-system/internal/db"
	"net/http"
)

// Response struct bersih tanpa sql.Null types
type EmployeeResponse struct {
	ID         int32  `json:"id"`
	UserID     int32  `json:"user_id"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
}

func toEmployeeResponse(e db.Employee) EmployeeResponse {
	phone := ""
	if e.Phone.Valid {
		phone = e.Phone.String
	}
	return EmployeeResponse{
		ID:         e.ID,
		UserID:     e.UserID,
		FullName:   e.FullName,
		Department: e.Department,
		Position:   e.Position,
		Phone:      phone,
	}
}

func GetAllEmployees(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	employees, err := queries.GetAllEmployees(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]EmployeeResponse{})
		return
	}

	result := make([]EmployeeResponse, len(employees))
	for i, e := range employees {
		result[i] = toEmployeeResponse(e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}