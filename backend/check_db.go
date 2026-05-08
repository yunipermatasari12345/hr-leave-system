package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Gagal koneksi: %v", err)
	}
	defer conn.Close(ctx)

	rows, err := conn.Query(ctx, "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'leave_histories'")
	if err != nil {
		log.Fatalf("Gagal query constraints: %v", err)
	}
	defer rows.Close()

	fmt.Println("Constraints on table 'leave_histories':")
	for rows.Next() {
		var name, ctype string
		rows.Scan(&name, &ctype)
		fmt.Printf("- %s (%s)\n", name, ctype)
	}
}
