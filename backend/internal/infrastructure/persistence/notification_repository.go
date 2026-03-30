package persistence

import (
	"context"
	"database/sql"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/notification"
)

type notificationRepository struct {
	q *db.Queries
}

func NewNotificationRepository(raw *sql.DB) notification.Repository {
	return &notificationRepository{q: db.New(raw)}
}

func (r *notificationRepository) Create(ctx context.Context, userID int32, message string) error {
	_, err := r.q.CreateNotification(ctx, db.CreateNotificationParams{
		UserID:  userID,
		Message: message,
	})
	return err
}
