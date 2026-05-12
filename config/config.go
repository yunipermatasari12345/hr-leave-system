package config

import (
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB
var InitError error

func InitDB() {
	dsnRaw := os.Getenv("DATABASE_URL")
	if dsnRaw == "" {
		InitError = fmt.Errorf("DATABASE_URL tidak ditemukan di environment variables")
		log.Println(InitError)
		return
	}
	dsn := augmentPostgresURL(strings.TrimSpace(dsnRaw))

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		InitError = fmt.Errorf("gagal membuka koneksi database: %w", err)
		log.Println(InitError)
		return
	}

	// Atur pool koneksi yang lebih ramah serverless
	DB.SetMaxOpenConns(5)
	DB.SetMaxIdleConns(2)
	DB.SetConnMaxLifetime(10 * time.Minute)
	DB.SetConnMaxIdleTime(5 * time.Minute)

	// Cobalah ping beberapa kali dengan jeda (untuk menangani Neon cold start)
	if err := pingWithRetry(DB, 5); err != nil {
		InitError = fmt.Errorf("database tidak merespon setelah beberapa kali percobaan: %w", err)
		log.Println(InitError)
		return
	}

	log.Println("Koneksi database berhasil dan stabil!")
	InitError = nil
}

// augmentPostgresURL menambah parameter yang membantu stabilitas ke Neon / Postgres jarak jauh.
func augmentPostgresURL(dsn string) string {
	if !strings.HasPrefix(dsn, "postgres://") && !strings.HasPrefix(dsn, "postgresql://") {
		return dsn
	}
	u, err := url.Parse(dsn)
	if err != nil {
		return dsn
	}
	q := u.Query()
	if q.Get("connect_timeout") == "" {
		q.Set("connect_timeout", "15")
	}
	if q.Get("sslmode") == "" && strings.Contains(strings.ToLower(u.Host), "neon.tech") {
		q.Set("sslmode", "require")
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func applyPoolSettings(db *sql.DB) {
	maxOpen := envInt("DB_MAX_OPEN_CONNS", 5)
	maxIdle := envInt("DB_MAX_IDLE_CONNS", 2)
	if maxIdle > maxOpen {
		maxIdle = maxOpen
	}
	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(time.Duration(envInt("DB_CONN_MAX_LIFETIME_SEC", 300)) * time.Second)
	db.SetConnMaxIdleTime(time.Duration(envInt("DB_CONN_MAX_IDLE_SEC", 120)) * time.Second)
}

func envInt(key string, fallback int) int {
	s := os.Getenv(key)
	if s == "" {
		return fallback
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return fallback
	}
	return n
}

func pingWithRetry(db *sql.DB, attempts int) error {
	var last error
	for i := 0; i < attempts; i++ {
		last = db.Ping()
		if last == nil {
			return nil
		}
		log.Printf("ping database percobaan %d/%d: %v", i+1, attempts, last)
		time.Sleep(time.Duration(250+150*i) * time.Millisecond)
	}
	return last
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
