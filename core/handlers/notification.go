package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"hr-leave-system/internal/domain/notification"
	"hr-leave-system/internal/middleware"
)

var NotificationRepo notification.Repository

func GetMyNotifications(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Context().Value(middleware.UserIDKey)
	var userID int32
	switch v := userIDStr.(type) {
	case float64:
		userID = int32(v)
	case int32:
		userID = v
	default:
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	notifs, err := NotificationRepo.ListByUser(r.Context(), userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifs)
}

func MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	err = NotificationRepo.MarkAsRead(r.Context(), int32(id))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
