package handlers

import (
	"encoding/json"
	"net/http"

	"hr-leave-system/internal/domain/employee"
)

type EmployeeResponse struct {
	ID         int32  `json:"id"`
	UserID     int32  `json:"user_id"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
}

func toEmployeeResponse(e employee.Employee) EmployeeResponse {
	return EmployeeResponse{
		ID:         e.ID,
		UserID:     e.UserID,
		FullName:   e.FullName,
		Department: e.Department,
		Position:   e.Position,
		Phone:      e.Phone,
	}
}

func GetAllEmployees(w http.ResponseWriter, r *http.Request) {
	employees, err := EmployeeService.List(r.Context())
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
