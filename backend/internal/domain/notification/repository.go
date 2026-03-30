package notification

import "context"

type Repository interface {
	Create(ctx context.Context, userID int32, message string) error
}
