package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Gagal koneksi: %v", err)
	}
	defer conn.Close(ctx)

	email := "karyawan@test.com"
	password := "Karyawan123"
	fullName := "Budi Karyawan"
	role := "employee" // use lowercase to be safe
	dept := "IT"
	pos := "Junior Developer"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Gagal hash: %v", err)
	}

	// 1. Insert/Update User
	var userID int32
	err = conn.QueryRow(ctx, 
		`INSERT INTO users (email, password, role, created_at) 
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (email) DO UPDATE SET password = $2, role = $3
		 RETURNING id`,
		email, string(hashedPassword), role, time.Now(),
	).Scan(&userID)

	if err != nil {
		log.Fatalf("Gagal user: %v", err)
	}
	fmt.Printf("User ID: %d\n", userID)

	// 2. Insert/Update Employee
	var employeeID int32
	err = conn.QueryRow(ctx, "SELECT id FROM employees WHERE user_id = $1", userID).Scan(&employeeID)
	if err != nil {
		// Insert new
		err = conn.QueryRow(ctx, 
			`INSERT INTO employees (user_id, full_name, department, position, phone, joined_at) 
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id`,
			userID, fullName, dept, pos, "08123456789", time.Now(),
		).Scan(&employeeID)
	} else {
		// Update existing
		_, err = conn.Exec(ctx, 
			`UPDATE employees SET full_name = $1, department = $2, position = $3 WHERE id = $4`,
			fullName, dept, pos, employeeID,
		)
	}

	if err != nil {
		log.Fatalf("Gagal employee: %v", err)
	}
	fmt.Printf("Employee ID: %d\n", employeeID)

	// 3. Set Leave Balance (Optional but good for testing)
	// We need a leave_type_id. Let's assume ID 1 is "Cuti Tahunan"
	_, err = conn.Exec(ctx, 
		`INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, remaining_days) 
		 VALUES ($1, 1, $2, 12, 0, 12)
		 ON CONFLICT DO NOTHING`, // simplified
		employeeID, time.Now().Year(),
	)

	fmt.Println("--------------------------------------------------")
	fmt.Println("AKUN KARYAWAN BERHASIL DIBUAT!")
	fmt.Printf("Email: %s\n", email)
	fmt.Printf("Password: %s\n", password)
	fmt.Println("--------------------------------------------------")
}
