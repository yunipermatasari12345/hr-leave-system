package api

import (
	"net/http"
	"hr-leave-system/config"
	"hr-leave-system/core/application"
	"hr-leave-system/core/handlers"
	"hr-leave-system/core/infrastructure/persistence"
	mw "hr-leave-system/core/middleware"

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
		r.Post("/auth/verify", handlers.VerifyRegistration)

		r.Get("/leave-types", handlers.GetLeaveTypes)

		r.Route("/employee", func(r chi.Router) {
			r.Use(mw.Auth)
			r.Get("/leaves", handlers.GetMyLeaves)
			r.Post("/leaves", handlers.CreateLeaveRequest_)
			r.Get("/leave-balances", handlers.GetMyBalances)
			r.Get("/notifications", handlers.GetMyNotifications)
			r.Put("/notifications/{id}/read", handlers.MarkNotificationRead)
		})

		r.Route("/hrd", func(r chi.Router) {
			r.Use(mw.Auth, mw.Role("HRD"))
			r.Get("/leaves/advanced", handlers.GetAdvancedLeaves)
			r.Put("/leaves/{id}/status", handlers.UpdateLeaveStatus)
			r.Delete("/leaves/{id}", handlers.DeleteLeaveRequest)
			r.Post("/leaves/manual", handlers.CreateManualLeaveHR)
			
			r.Get("/employees", handlers.GetAllEmployees)
			r.Post("/employees", handlers.CreateEmployee)
			r.Delete("/employees/{id}", handlers.DeleteEmployee)
			
			r.Get("/dashboard/stats", handlers.GetDashboardStats)
			r.Get("/dashboard/monthly", handlers.GetMonthlyStats)
			r.Get("/departments", handlers.GetDepartments)
			r.Get("/positions", handlers.GetPositions)
			r.Get("/reports/departments", handlers.GetLeaveRecapPerDepartment)
			
			r.Get("/audit-logs", handlers.GetAuditLogs)
		})
	})
}

func Handler(w http.ResponseWriter, req *http.Request) {
	r.ServeHTTP(w, req)
}
