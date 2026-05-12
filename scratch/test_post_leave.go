package main

import (
	"bytes"
	"context"
	"fmt"
	"hr-leave-system/config"
	"hr-leave-system/core/application"
	"hr-leave-system/core/handlers"
	"hr-leave-system/core/infrastructure/persistence"
	"hr-leave-system/core/middleware"
	"net/http/httptest"
)

func main() {
	config.InitDB()
	db := config.DB
	
	leaveRepo := persistence.NewLeaveRepository(db)
	employeeRepo := persistence.NewEmployeeRepository(db)
	notifRepo := persistence.NewNotificationRepository(db)
	
	handlers.LeaveService = application.NewLeaveService(leaveRepo, employeeRepo, notifRepo)

	// Test POST /api/employee/leaves
	jsonBody := []byte(`{"leave_type_id": 1, "start_date": "2026-07-01", "end_date": "2026-07-03", "reason": "Test from Go script"}`)
	req := httptest.NewRequest("POST", "/api/employee/leaves", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	
	// Add user id to context (ID 9 exists and has an employee record)
	ctx := context.WithValue(req.Context(), middleware.UserIDKey, float64(9))
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	handlers.CreateLeaveRequest_(rr, req)

	fmt.Printf("Status Code: %d\n", rr.Code)
	fmt.Printf("Body: %s\n", rr.Body.String())
}
