package main

import (
	"context"
	"fmt"
	"hr-leave-system/config"
	"hr-leave-system/core/application"
	"hr-leave-system/core/infrastructure/persistence"
	"log"
)

func main() {
	config.InitDB()
	raw := config.DB
	leaveRepo := persistence.NewLeaveRepository(raw)
	employeeRepo := persistence.NewEmployeeRepository(raw)
	notifRepo := persistence.NewNotificationRepository(raw)

	leaveService := application.NewLeaveService(leaveRepo, employeeRepo, notifRepo)

	// Fetch an employee to test with
	var userID int32
	var empID int32
	err := raw.QueryRow("SELECT id, user_id FROM employees LIMIT 1").Scan(&empID, &userID)
	if err != nil {
		log.Fatalf("No employee found: %v", err)
	}

	var leaveTypeID int32
	err = raw.QueryRow("SELECT id FROM leave_types LIMIT 1").Scan(&leaveTypeID)
	if err != nil {
		log.Fatalf("No leave types found: %v", err)
	}

	fmt.Printf("Testing SubmitRequest for userID=%d, leaveTypeID=%d\n", userID, leaveTypeID)

	req, err := leaveService.SubmitRequest(
		context.Background(),
		userID,
		leaveTypeID,
		"2026-06-01",
		"2026-06-05",
		"Test reason",
		"",
		nil,
	)

	if err != nil {
		log.Fatalf("SubmitRequest failed: %v", err)
	}

	fmt.Printf("Success! LeaveRequest created with ID: %d\n", req.ID)
}
