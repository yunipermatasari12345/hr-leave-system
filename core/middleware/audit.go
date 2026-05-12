package middleware

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"hr-leave-system/config"
	"hr-leave-system/core/db"
)

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rec *responseRecorder) WriteHeader(statusCode int) {
	rec.statusCode = statusCode
	rec.ResponseWriter.WriteHeader(statusCode)
}

func AuditLogMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &responseRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK, // default
		}

		// Jalankan request
		next.ServeHTTP(rec, r)

		method := r.Method
		// Catat aksi pembaruan data (POST, PUT, DELETE, PATCH)
		if method == http.MethodPost || method == http.MethodPut || method == http.MethodDelete || method == http.MethodPatch {
			
			// Jika gagal (dibatalkan, validasi error, dsb), JANGAN DITULIS KE LOG
			if rec.statusCode >= 400 {
				return
			}

			var userID sql.NullInt32
			if uid, ok := UserIDFromContext(r.Context()); ok {
				userID = sql.NullInt32{Int32: uid, Valid: true}
			}
			log.Printf("[Audit-Debug] UserID found in context: %v\n", userID)

			// Simpan ke database secara langsung (Sync) agar tidak hilang di Vercel
			if config.DB != nil {
				q := db.New(config.DB)
				_, err := q.LogAudit(context.Background(), db.LogAuditParams{
					UserID: userID,
					Action: method,
					Path:   r.URL.Path,
					IpAddress: sql.NullString{
						String: r.RemoteAddr,
						Valid:  r.RemoteAddr != "",
					},
				})
				if err != nil {
					log.Printf("[Audit] Gagal merekam jejak: %v\n", err)
				}
			}
		}
	})
}
