package notification

import "context"

type Repository interface {
	Create(ctx context.Context, userID int32, message string) error
	ListByUser(ctx context.Context, userID int32) ([]Notification, error)
	MarkAsRead(ctx context.Context, id int32) error
}
