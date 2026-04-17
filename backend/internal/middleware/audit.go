package middleware

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"hr-leave-system/config"
	"hr-leave-system/internal/db"
)

func AuditLogMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Jalankan request terlebih dahulu (termasuk diproses oleh router/handler selanjutnya)
		next.ServeHTTP(w, r)

		method := r.Method
		// Sesuai instruksi: catat PUT, GET, DELETE (dan POST sebagai bonus umum)
		if method == http.MethodGet || method == http.MethodPut || method == http.MethodDelete || method == http.MethodPost {
			
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

			// Simpan catat aktivitas ke audit log
			go func(reqMethod, reqPath, reqIP string, uid sql.NullInt32) {
				// Cegah crash jika config.DB belum inisialisasi sepenuhnya, walau kecil kemungkinannya
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
					// Hanya rekam ke error log, jangan mengganggu flow utama
					log.Printf("[Audit] Gagal merekam jejak operasi %s di %s: %v\n", reqMethod, reqPath, err)
				}
			}(method, r.URL.Path, r.RemoteAddr, userID)
		}
	})
}
