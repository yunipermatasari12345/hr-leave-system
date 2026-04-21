package middleware

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"hr-leave-system/config"
	"hr-leave-system/internal/db"
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
			val := r.Context().Value(UserIDKey)
			if val != nil {
				switch v := val.(type) {
				case float64:
					userID = sql.NullInt32{Int32: int32(v), Valid: true}
				case int32:
					userID = sql.NullInt32{Int32: v, Valid: true}
				case int:
					userID = sql.NullInt32{Int32: int32(v), Valid: true}
				}
			}

			// Simpan ke database asinkron
			go func(reqMethod, reqPath, reqIP string, uid sql.NullInt32) {
				if config.DB == nil {
					return
				}
				q := db.New(config.DB)
				_, err := q.LogAudit(context.Background(), db.LogAuditParams{
					UserID: uid,
					Action: reqMethod,
					Path:   reqPath,
					IpAddress: sql.NullString{
						String: reqIP,
						Valid:  reqIP != "",
					},
				})
				if err != nil {
					log.Printf("[Audit] Gagal merekam jejak operasi %s di %s: %v\n", reqMethod, reqPath, err)
				}
			}(method, r.URL.Path, r.RemoteAddr, userID)
		}
	})
}
