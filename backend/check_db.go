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
		log.Fatal(err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, employee_id, attachment_url, status FROM leave_requests ORDER BY id DESC LIMIT 10")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("ID | EmpID | AttachmentURL | Status")
	fmt.Println("---|-------|---------------|-------")
	for rows.Next() {
		var id, empID int
		var attach sql.NullString
		var status string
		err = rows.Scan(&id, &empID, &attach, &status)
		if err != nil {
			log.Fatal(err)
		}
		attachVal := "NULL"
		if attach.Valid {
			attachVal = attach.String
		}
		fmt.Printf("%d | %d | %s | %s\n", id, empID, attachVal, status)
	}
}
