package application

import "errors"

var (
	ErrValidation       = errors.New("validasi gagal")
	ErrUnauthorized     = errors.New("tidak diizinkan")
	ErrEmployeeNotFound = errors.New("data karyawan tidak ditemukan")
	ErrEmailTaken       = errors.New("email sudah digunakan")
)
