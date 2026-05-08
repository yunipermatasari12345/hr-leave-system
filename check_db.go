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

	fmt.Println("=== USERS ===")
	rows, _ := conn.Query(ctx, "SELECT id, email, role FROM users ORDER BY id")
	defer rows.Close()
	for rows.Next() {
		var id int32
		var email, role string
		rows.Scan(&id, &email, &role)
		fmt.Printf("ID=%d | Email=%s | Role=%s\n", id, email, role)
	}

	fmt.Println("\n=== EMPLOYEES ===")
	rows2, _ := conn.Query(ctx, "SELECT id, user_id, full_name, department, position FROM employees ORDER BY id")
	defer rows2.Close()
	for rows2.Next() {
		var id, userID int32
		var name, dept, pos string
		rows2.Scan(&id, &userID, &name, &dept, &pos)
		fmt.Printf("ID=%d | UserID=%d | Name=%s | Dept=%s | Pos=%s\n", id, userID, name, dept, pos)
	}

	fmt.Println("\n=== LEAVE_TYPES ===")
	rows3, _ := conn.Query(ctx, "SELECT id, name, max_days FROM leave_types ORDER BY id")
	defer rows3.Close()
	for rows3.Next() {
		var id, maxDays int32
		var name string
		rows3.Scan(&id, &name, &maxDays)
		fmt.Printf("ID=%d | Name=%s | MaxDays=%d\n", id, name, maxDays)
	}

	fmt.Println("\n=== LEAVE_BALANCES (2026) ===")
	rows4, _ := conn.Query(ctx, "SELECT employee_id, leave_type_id, used_days, remaining_days FROM leave_balances WHERE year=2026 ORDER BY employee_id")
	defer rows4.Close()
	for rows4.Next() {
		var empID, typeID, used, remaining int32
		rows4.Scan(&empID, &typeID, &used, &remaining)
		fmt.Printf("EmpID=%d | TypeID=%d | Used=%d | Remaining=%d\n", empID, typeID, used, remaining)
	}
}
