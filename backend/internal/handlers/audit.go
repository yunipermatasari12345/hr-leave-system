package handlers

import (
	"encoding/json"
	"net/http"

	"hr-leave-system/config"
	"hr-leave-system/internal/db"
)

func GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	if config.DB == nil {
		sendError(w, 500, "Database connection not initialized")
		return
	}
	
	q := db.New(config.DB)
	logs, err := q.GetAuditLogs(r.Context())
	if err != nil {
		sendError(w, 500, "Gagal mengambil audit trail")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	
	type AuditLogDTO struct {
		ID        int32  `json:"id"`
		FullName  string `json:"full_name"`
		Email     string `json:"email"`
		Action    string `json:"action"`
		Path      string `json:"path"`
		IpAddress string `json:"ip_address"`
		CreatedAt string `json:"created_at"`
	}

	var response []AuditLogDTO
	for _, l := range logs {
		ip := "-"
		if l.IpAddress.Valid {
			ip = l.IpAddress.String
		}
		
		createdAt := ""
		if l.CreatedAt.Valid {
			createdAt = l.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}

		response = append(response, AuditLogDTO{
			ID:        l.ID,
			FullName:  l.FullName,
			Email:     l.Email,
			Action:    l.Action,
			Path:      l.Path,
			IpAddress: ip,
			CreatedAt: createdAt,
		})
	}

	if response == nil {
		response = []AuditLogDTO{}
	}

	json.NewEncoder(w).Encode(response)
}
