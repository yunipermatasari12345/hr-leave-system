package notification

import "time"

type Notification struct {
	ID        int32     `json:"id"`
	UserID    int32     `json:"user_id"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
