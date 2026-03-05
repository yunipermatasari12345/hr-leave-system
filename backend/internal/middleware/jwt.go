package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserRoleKey contextKey = "userRole"

var JwtSecret = []byte("HR_LEAVE_SECRET_KEY_2024")

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Ambil token dari header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Token tidak ditemukan"}`, http.StatusUnauthorized)
			return
		}

		// Format header: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"Format token salah"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Verifikasi token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return JwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Token tidak valid"}`, http.StatusUnauthorized)
			return
		}

		// Ambil data dari token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"Token tidak bisa dibaca"}`, http.StatusUnauthorized)
			return
		}

		// Simpan ke context
		ctx := context.WithValue(r.Context(), UserIDKey, claims["user_id"])
		ctx = context.WithValue(ctx, UserRoleKey, claims["role"])

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Middleware khusus HRD saja
func HRDOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := r.Context().Value(UserRoleKey)
		if role != "hrd" {
			http.Error(w, `{"error":"Akses ditolak, hanya HRD"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}