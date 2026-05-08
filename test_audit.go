package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"hr-leave-system/config"
	"hr-leave-system/internal/db"
)

func main() {
	config.InitDB()
	q := db.New(config.DB)

	userID := sql.NullInt32{Int32: 1, Valid: true}
	logParam := db.LogAuditParams{
		UserID:    userID,
		Action:    "POST",
		Path:      "/api/test-insert",
		IpAddress: sql.NullString{String: "127.0.0.1", Valid: true},
	}

	audit, err := q.LogAudit(context.Background(), logParam)
	if err != nil {
		log.Fatalf("Insert error: %v", err)
	}
	fmt.Printf("Inserted ID: %d\n", audit.ID)
}
