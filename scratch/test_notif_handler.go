package main

import (
	"context"
	"fmt"
	"hr-leave-system/config"
	"hr-leave-system/core/handlers"
	"hr-leave-system/core/infrastructure/persistence"
	"hr-leave-system/core/middleware"
	"net/http/httptest"
)

func main() {
	config.InitDB()
	db := config.DB
	notifRepo := persistence.NewNotificationRepository(db)
	handlers.NotificationRepo = notifRepo

	// Test GetMyNotifications
	req := httptest.NewRequest("GET", "/api/employee/notifications", nil)
	
	// Add user id to context
	ctx := context.WithValue(req.Context(), middleware.UserIDKey, float64(9))
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	handlers.GetMyNotifications(rr, req)

	fmt.Printf("Status Code: %d\n", rr.Code)
	fmt.Printf("Body: %s\n", rr.Body.String())
}
