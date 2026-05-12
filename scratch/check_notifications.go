package main

import (
	"fmt"
	"hr-leave-system/config"
)

func main() {
	config.InitDB()
	db := config.DB

	// Check notifications table
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM notifications").Scan(&count)
	if err != nil {
		fmt.Printf("Error accessing notifications table: %v\n", err)
	} else {
		fmt.Printf("Total notifications: %d\n", count)
	}

	// Check table structure for notifications
	rows, err := db.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'notifications'
	`)
	if err == nil {
		fmt.Println("Notifications table structure:")
		for rows.Next() {
			var name, dtype string
			rows.Scan(&name, &dtype)
			fmt.Printf("- %s (%s)\n", name, dtype)
		}
		rows.Close()
	}

	// Check if any user id exists that we expect
	var userID int
	err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
	if err == nil {
		fmt.Printf("Found a user ID: %d. Testing GetNotificationsByUser query...\n", userID)
		rows, err := db.Query("SELECT id, user_id, message, is_read, created_at FROM notifications WHERE user_id = $1", userID)
		if err != nil {
			fmt.Printf("Query failed: %v\n", err)
		} else {
			fmt.Println("Query succeeded!")
			rows.Close()
		}
	}
}
