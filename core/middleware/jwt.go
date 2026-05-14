package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserRoleKey contextKey = "userRole"

var JwtSecret = []byte("HR_LEAVE_SECRET_KEY_2024")

// UserIDFromContext membaca user_id dari context JWT (tipe klaim bisa bervariasi).
func UserIDFromContext(ctx context.Context) (int32, bool) {
	val := ctx.Value(UserIDKey)
	if val == nil {
		return 0, false
	}
	switch v := val.(type) {
	case float64:
		if v <= 0 || v > 2147483647 {
			return 0, false
		}
		return int32(v), true
	case int32:
		return v, true
	case int:
		return int32(v), true
	case int64:
		if v <= 0 || v > 2147483647 {
			return 0, false
		}
		return int32(v), true
	case json.Number:
		n, err := v.Int64()
		if err != nil || n <= 0 || n > 2147483647 {
			return 0, false
		}
		return int32(n), true
	case string:
		n, err := strconv.ParseInt(strings.TrimSpace(v), 10, 32)
		if err != nil || n < 0 {
			return 0, false
		}
		return int32(n), true
	default:
		return 0, false
	}
}

// UserRoleFromContext membaca role dari context JWT.
func UserRoleFromContext(ctx context.Context) (string, bool) {
	val := ctx.Value(UserRoleKey)
	if val == nil {
		return "", false
	}
	return fmt.Sprintf("%v", val), true
}


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

// Auth adalah alias untuk JWTMiddleware agar lebih pendek di router
func Auth(next http.Handler) http.Handler {
	return JWTMiddleware(next)
}

// HRDOnly memaksa JWT + role hrd (untuk backend/server standalone).
func HRDOnly(next http.Handler) http.Handler {
	return Role("hrd")(next)
}

// Role adalah middleware dinamis untuk mengecek role tertentu
func Role(requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := r.Context().Value(UserRoleKey)
			userRole := strings.ToLower(fmt.Sprintf("%v", role))
			
			// Jika role adalah 'admin', dia boleh akses semua (Super User)
			// Atau jika role sesuai dengan yang diminta
			if role == nil || (userRole != strings.ToLower(requiredRole) && userRole != "admin") {
				http.Error(w, `{"error":"Akses ditolak, butuh role `+requiredRole+`"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
