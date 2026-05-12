package main

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

func main() {
	secret := []byte("HR_LEAVE_SECRET_KEY_2024")
	claims := jwt.MapClaims{
		"user_id": 9,
		"role":    "employee",
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(secret)
	fmt.Println(tokenString)
}
