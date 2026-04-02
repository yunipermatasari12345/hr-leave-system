package main

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"log"
)

func main() {
	connStr := "postgresql://postgres:postgres123@localhost:5432/hr_leave_db?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi: %v", err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, reason, attachment_url FROM leave_requests ORDER BY id DESC LIMIT 20")
	if err != nil {
		log.Fatalf("Gagal query: %v", err)
	}
	defer rows.Close()

	fmt.Println("ID | Reason | AttachmentURL")
	fmt.Println("---|--------|---------------")
	for rows.Next() {
		var id int
		var reason string
		var url sql.NullString
		rows.Scan(&id, &reason, &url)
		u := "NULL"
		if url.Valid {
			u = "'" + url.String + "'"
		}
		fmt.Printf("%d | %s | %s\n", id, reason, u)
	}
}
