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

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		host := getEnv("DB_HOST", "localhost")
		port := getEnv("DB_PORT", "5432")
		user := getEnv("DB_USER", "postgres")
		password := getEnv("DB_PASSWORD", "postgres123")
		dbname := getEnv("DB_NAME", "hr_leave_db")

		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname,
		)
	} else {
		dsn = augmentPostgresURL(strings.TrimSpace(dsn))
	}

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Gagal koneksi database:", err)
	}

	applyPoolSettings(DB)

	if err := pingWithRetry(DB, 4); err != nil {
		log.Fatal("Database tidak bisa diping:", err)
	}

	log.Println("Koneksi database berhasil!")
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
