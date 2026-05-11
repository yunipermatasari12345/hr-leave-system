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

func registerAPIRoutes(router chi.Router) {
	router.Post("/auth/login", handlers.Login)
	router.Post("/auth/logout", handlers.Logout)
	router.With(mw.Auth).Get("/auth/me", handlers.Me)
	router.Post("/auth/verify", handlers.VerifyRegistration)

	router.Get("/leave-types", handlers.GetLeaveTypes)

	router.Route("/employee", func(r chi.Router) {
		r.Use(mw.Auth)
		r.Get("/leaves", handlers.GetMyLeaves)
		r.Get("/leaves/{id}/attachment", handlers.GetLeaveAttachmentEmployee)
		r.Post("/leaves", handlers.CreateLeaveRequest_)
		r.Get("/leave-balances", handlers.GetMyBalances)
		r.Get("/notifications", handlers.GetMyNotifications)
		r.Put("/notifications/{id}/read", handlers.MarkNotificationRead)
	})

	router.Route("/hrd", func(r chi.Router) {
		r.Use(mw.Auth, mw.Role("HRD"))
		r.Get("/leaves/advanced", handlers.GetAdvancedLeaves)
		r.Get("/leaves/{id}/attachment", handlers.GetLeaveAttachmentHR)
		r.Put("/leaves/{id}/status", handlers.UpdateLeaveStatus)
		r.Delete("/leaves/{id}", handlers.DeleteLeaveRequest)
		r.Post("/leaves/manual", handlers.CreateManualLeaveHR)

		r.Get("/employees", handlers.GetAllEmployees)
		r.Post("/employees", handlers.CreateEmployee)
		r.Put("/employees/{id}", handlers.UpdateEmployee)
		r.Delete("/employees/{id}", handlers.DeleteEmployee)

		r.Get("/dashboard/stats", handlers.GetDashboardStats)
		r.Get("/dashboard/monthly", handlers.GetMonthlyStats)
		r.Get("/departments", handlers.GetDepartments)
		r.Get("/positions", handlers.GetPositions)
		r.Get("/reports/departments", handlers.GetLeaveRecapPerDepartment)

		r.Get("/audit-logs", handlers.GetAuditLogs)
	})
}

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

	// Route kompatibel untuk Vercel rewrite:
	// - /api/auth/login (umum)
	// - /auth/login (jika prefix /api ter-strip oleh rewrite)
	r.Route("/api", registerAPIRoutes)
	r.Group(registerAPIRoutes)
}

func Handler(w http.ResponseWriter, req *http.Request) {
	r.ServeHTTP(w, req)
}
