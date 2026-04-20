package main

import (
	"context"
	"fmt"
	"log"

	"hr-leave-system/config"
	"hr-leave-system/internal/db"
)

func main() {
	config.InitDB()
	q := db.New(config.DB)

	logs, err := q.GetAuditLogs(context.Background())
	if err != nil {
		log.Fatalf("Query error: %v", err)
	}

	fmt.Printf("Fatched %d logs\n", len(logs))
	if len(logs) > 0 {
		fmt.Printf("First log: %+v\n", logs[0])
	}
}
