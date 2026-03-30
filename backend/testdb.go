package main

import (
	"context"
	"fmt"
	"hr-leave-system/config"
	"hr-leave-system/internal/db"
	"log"
)

func main() {
	config.InitDB()
	q := db.New(config.DB)

	leaves, err := q.GetAdvancedLeaves(context.Background(), db.GetAdvancedLeavesParams{
		Column1: "",
		Column2: "",
	})
	if err != nil {
		log.Fatalf("Error GetAdvancedLeaves: %v\n", err)
	}
	
	fmt.Printf("Total leaves found: %d\n", len(leaves))
	for i, l := range leaves {
		fmt.Printf("[%d] ID: %d | Employee: %s | Status: %s | Date: %v to %v\n", 
			i, l.ID, l.EmployeeName, l.Status, l.StartDate, l.EndDate)
	}
}
