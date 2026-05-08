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

	// 1. Tambahkan Leave Types jika belum ada
	types := []struct {
		ID      int
		Name    string
		MaxDays int
	}{
		{1, "Cuti Tahunan", 12},
		{2, "Sakit", 30},
		{3, "Izin Penting", 5},
	}

	fmt.Println("Mengisi Jenis Cuti...")
	for _, t := range types {
		_, err := conn.Exec(ctx, 
			"INSERT INTO leave_types (id, name, max_days) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, max_days = $3",
			t.ID, t.Name, t.MaxDays,
		)
		if err != nil {
			fmt.Printf("Gagal insert type %s: %v\n", t.Name, err)
		}
	}

	// 2. Pastikan Employee ID 3 (Budi) punya balance untuk Type 1 (Cuti Tahunan)
	fmt.Println("Mengatur Jatah Cuti Budi...")
	_, err = conn.Exec(ctx, 
		`INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, remaining_days) 
		 VALUES (3, 1, 2026, 12, 0, 12)
		 ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
	)
	if err != nil {
		// Jika gagal karena constraint, coba update manual
		_, _ = conn.Exec(ctx, "UPDATE leave_balances SET remaining_days = 12 WHERE employee_id = 3 AND leave_type_id = 1")
	}

	fmt.Println("DATA DATABASE SUDAH DILENGKAPI!")
}
