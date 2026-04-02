package main

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"log"
)

func main() {
	fmt.Println("Memulai pengecekan database...")
	connStr := "postgresql://postgres:postgres123@localhost:5432/hr_leave_db?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Gagal ping database: %v", err)
	}
	fmt.Println("Koneksi berhasil!")

	rows, err := db.Query("SELECT id, attachment_url FROM leave_requests WHERE attachment_url IS NOT NULL")
	if err != nil {
		log.Fatalf("Gagal query: %v", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var url sql.NullString
		rows.Scan(&id, &url)
		fmt.Printf("ID: %d, URL: %s\n", id, url.String)
		count++
	}
	fmt.Printf("Total pengajuan dengan lampiran: %d\n", count)
}
