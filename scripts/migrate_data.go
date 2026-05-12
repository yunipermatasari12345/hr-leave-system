package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// GANTI DENGAN ALAMAT DATABASE ANDA
const (
	OLD_DB_URL = "ISI_DENGAN_CONNECTION_STRING_LAMA"
	NEW_DB_URL = "ISI_DENGAN_CONNECTION_STRING_BARU_SINGAPORE"
)

func main() {
	// 1. Hubungkan ke DB Lama
	oldDB, err := sql.Open("postgres", OLD_DB_URL)
	if err != nil {
		log.Fatal("Gagal konek DB Lama:", err)
	}
	defer oldDB.Close()

	// 2. Hubungkan ke DB Baru
	newDB, err := sql.Open("postgres", NEW_DB_URL)
	if err != nil {
		log.Fatal("Gagal konek DB Baru:", err)
	}
	defer newDB.Close()

	fmt.Println("⏳ Mulai menyalin data... Mohon tunggu.")

	// Urutan tabel harus benar agar tidak error (Foreign Key)
	tables := []string{
		"users",
		"positions",
		"departments",
		"employees",
		"leave_types",
		"leave_balances",
		"leave_requests",
		"leave_histories",
		"audit_logs",
		"notifications",
	}

	for _, table := range tables {
		fmt.Printf("📦 Memindahkan tabel: %s...\n", table)
		if err := migrateTable(oldDB, newDB, table); err != nil {
			log.Printf("⚠️ Gagal di tabel %s: %v\n", table, err)
		}
	}

	fmt.Println("✅ SELESAI! Semua data telah dipindah ke Singapore.")
	fmt.Println("Sekarang Anda bisa update DATABASE_URL di Vercel dengan alamat yang baru.")
}

func migrateTable(oldDB, newDB *sql.DB, tableName string) error {
	// Ambil semua data dari tabel lama
	rows, err := oldDB.Query(fmt.Sprintf("SELECT * FROM %s", tableName))
	if err != nil {
		return err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return err
	}

	// Siapkan query INSERT
	placeholders := ""
	colNames := ""
	for i, col := range cols {
		if i > 0 {
			placeholders += ", "
			colNames += ", "
		}
		placeholders += fmt.Sprintf("$%d", i+1)
		colNames += col
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT DO NOTHING", tableName, colNames, placeholders)

	for rows.Next() {
		columns := make([]interface{}, len(cols))
		columnPointers := make([]interface{}, len(cols))
		for i := range columns {
			columnPointers[i] = &columns[i]
		}

		if err := rows.Scan(columnPointers...); err != nil {
			return err
		}

		_, err = newDB.Exec(query, columns...)
		if err != nil {
			return err
		}
	}

	return nil
}
