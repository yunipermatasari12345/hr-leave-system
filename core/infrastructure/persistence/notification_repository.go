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

func (r *notificationRepository) ListByUser(ctx context.Context, userID int32) ([]notification.Notification, error) {
	rows, err := r.q.GetNotificationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]notification.Notification, len(rows))
	for i, row := range rows {
		out[i] = notification.Notification{
			ID:        row.ID,
			UserID:    row.UserID,
			Message:   row.Message,
			IsRead:    row.IsRead.Bool,
			CreatedAt: row.CreatedAt.Time,
		}
	}
	return out, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id int32) error {
	_, err := r.q.MarkNotificationRead(ctx, id)
	return err
}
