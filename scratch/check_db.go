package main

import (
	"fmt"
	"hr-leave-system/config"
	"log"
)

func main() {
	config.InitDB()
	db := config.DB

	// Check users
	var userCount int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		log.Fatalf("Error counting users: %v", err)
	}
	fmt.Printf("Total users: %d\n", userCount)

	// Check employees
	var empCount int
	err = db.QueryRow("SELECT COUNT(*) FROM employees").Scan(&empCount)
	if err != nil {
		log.Fatalf("Error counting employees: %v", err)
	}
	fmt.Printf("Total employees: %d\n", empCount)

	// Check recent users
	rows, err := db.Query("SELECT id, email FROM users ORDER BY id DESC LIMIT 5")
	if err == nil {
		fmt.Println("Recent users:")
		for rows.Next() {
			var id int
			var email string
			rows.Scan(&id, &email)
			fmt.Printf("- %d: %s\n", id, email)
		}
		rows.Close()
	}

	// Check if any user lacks employee record
	var orphanCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE e.id IS NULL").Scan(&orphanCount)
	if err == nil {
		fmt.Printf("Users without employee record: %d\n", orphanCount)
	}
}
