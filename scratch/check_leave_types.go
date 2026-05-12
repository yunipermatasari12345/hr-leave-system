package main

import (
	"fmt"
	"hr-leave-system/config"
)

func main() {
	config.InitDB()
	db := config.DB

	rows, err := db.Query("SELECT id, name FROM leave_types")
	if err == nil {
		fmt.Println("Leave Types:")
		for rows.Next() {
			var id int
			var name string
			rows.Scan(&id, &name)
			fmt.Printf("- %d: %s\n", id, name)
		}
		rows.Close()
	} else {
		fmt.Printf("Error: %v\n", err)
	}
}
