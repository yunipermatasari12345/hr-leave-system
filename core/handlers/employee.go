package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"hr-leave-system/internal/domain/employee"
)

type EmployeeResponse struct {
	ID            int32  `json:"id"`
	UserID        int32  `json:"user_id"`
	FullName      string `json:"full_name"`
	Department    string `json:"department"`
	Position      string `json:"position"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	RemainingDays int32  `json:"remaining_days"`
	UsedDays      int32  `json:"used_days"`
}

func toEmployeeResponse(e employee.Employee) EmployeeResponse {
	return EmployeeResponse{
		ID:         e.ID,
		UserID:     e.UserID,
		FullName:   e.FullName,
		Department: e.Department,
		Position:   e.Position,
		Phone:      e.Phone,
		Email:      e.Email,
		Role:       e.Role,
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
	year := int32(time.Now().Year())

	for i, e := range employees {
		res := toEmployeeResponse(e)
		
		// Fetch balance for the employee
		balances, err := LeaveService.MyBalances(r.Context(), e.UserID, year)
		if err == nil {
			var sumRemaining int32 = 0
			var sumUsed int32 = 0
			for _, b := range balances {
				sumRemaining += b.RemainingDays
				sumUsed += b.UsedDays
			}
			res.RemainingDays = sumRemaining
			res.UsedDays = sumUsed
		}
		
		result[i] = res
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
