package user

type User struct {
	ID           int32
	Email        string
	PasswordHash string
	Role         string
}
