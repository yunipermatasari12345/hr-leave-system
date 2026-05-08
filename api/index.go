package api

import (
	"net/http"
	"hr-leave-system/config"
	"hr-leave-system/internal/application"
	"hr-leave-system/internal/handlers"
	"hr-leave-system/internal/infrastructure/persistence"
	mw "hr-leave-system/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

var r *chi.Mux

func init() {
	config.InitDB()
	raw := config.DB
	leaveRepo := persistence.NewLeaveRepository(raw)
	employeeRepo := persistence.NewEmployeeRepository(raw)
	userRepo := persistence.NewUserRepository(raw)
	notifRepo := persistence.NewNotificationRepository(raw)
	reportingRepo := persistence.NewReportingRepository(raw)

	handlers.NotificationRepo = notifRepo
	handlers.LeaveService = application.NewLeaveService(leaveRepo, employeeRepo, notifRepo)
	handlers.EmployeeService = application.NewEmployeeService(employeeRepo)
	handlers.AuthService = application.NewAuthService(userRepo, employeeRepo, mw.JwtSecret)
	handlers.ReportingService = application.NewReportingService(reportingRepo)

	r = chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/login", handlers.Login)
		r.Post("/auth/logout", handlers.Logout)
		r.Get("/auth/me", mw.Auth(handlers.Me))

		r.Route("/employee", func(r chi.Router) {
			r.Use(mw.Auth)
			r.Get("/leaves", handlers.GetMyLeaves)
			r.Post("/leaves", handlers.SubmitLeave)
			r.Get("/balances", handlers.GetMyBalances)
		})

		r.Route("/hr", func(r chi.Router) {
			r.Use(mw.Auth, mw.Role("HRD"))
			r.Get("/leaves", handlers.GetHRLeaves)
			r.Post("/leaves/{id}/status", handlers.SetLeaveStatus)
			r.Get("/employees", handlers.ListEmployees)
			r.Post("/employees", handlers.CreateEmployee)
			r.Delete("/employees/{id}", handlers.DeleteEmployee)
			r.Post("/manual-leave", handlers.SubmitManualLeave)
			r.Get("/reports", handlers.GetLeaveReport)
		})

		r.Route("/notifications", func(r chi.Router) {
			r.Use(mw.Auth)
			r.Get("/", handlers.GetMyNotifications)
			r.Post("/{id}/read", handlers.MarkNotificationRead)
		})
	})
}

func Handler(w http.ResponseWriter, req *http.Request) {
	r.ServeHTTP(w, req)
}
