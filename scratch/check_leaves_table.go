package main

import (
	"fmt"
	"hr-leave-system/config"
)

func main() {
	config.InitDB()
	db := config.DB

	rows, err := db.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'leave_requests'
	`)
	if err == nil {
		fmt.Println("leave_requests table structure:")
		for rows.Next() {
			var name, dtype string
			rows.Scan(&name, &dtype)
			fmt.Printf("- %s (%s)\n", name, dtype)
		}
		rows.Close()
	} else {
		fmt.Printf("Error: %v\n", err)
	}
}
