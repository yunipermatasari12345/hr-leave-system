package employee

type Employee struct {
	ID         int32  `json:"id"`
	UserID     int32  `json:"user_id"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
}
