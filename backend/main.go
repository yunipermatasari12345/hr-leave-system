package main

import (
	"hr-leave-system/config"
	"hr-leave-system/internal/application"
	"hr-leave-system/internal/handlers"
	"hr-leave-system/internal/infrastructure/persistence"
	mw "hr-leave-system/internal/middleware"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
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

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Route publik
	r.Post("/api/auth/login", handlers.Login)
	r.Post("/api/auth/verify", handlers.VerifyRegistration)
	r.Get("/api/leave-types", handlers.GetLeaveTypes)

	// Route butuh login
	r.Group(func(r chi.Router) {
		r.Use(mw.JWTMiddleware)

		// Karyawan
		r.Get("/api/employee/leaves", handlers.GetMyLeaves)
		r.Get("/api/employee/leave-balances", handlers.GetMyBalances)
		r.Post("/api/employee/leaves", handlers.CreateLeaveRequest_)
		r.Get("/api/employee/notifications", handlers.GetMyNotifications)
		r.Put("/api/employee/notifications/{id}/read", handlers.MarkNotificationRead)

		// HRD only
		r.Group(func(r chi.Router) {
			r.Use(mw.HRDOnly)
			r.Post("/api/hrd/employees", handlers.CreateEmployee)
			r.Get("/api/hrd/employees", handlers.GetAllEmployees)
			r.Get("/api/hrd/leaves", handlers.GetAllLeaves)
			r.Put("/api/hrd/leaves/{id}/status", handlers.UpdateLeaveStatus)

			// Enterprise Features
			r.Get("/api/hrd/dashboard/stats", handlers.GetDashboardStats)
			r.Get("/api/hrd/dashboard/monthly", handlers.GetMonthlyStats)
			r.Get("/api/hrd/leaves/advanced", handlers.GetAdvancedLeaves)
			r.Get("/api/hrd/reports/departments", handlers.GetLeaveRecapPerDepartment)
			
			// Master Data
			r.Get("/api/hrd/departments", handlers.GetDepartments)
			r.Get("/api/hrd/positions", handlers.GetPositions)
			r.Put("/api/hrd/employees/{id}", handlers.UpdateEmployee)
			r.Delete("/api/hrd/employees/{id}", handlers.DeleteEmployee)
		})
	})

	// Static file server untuk lampiran cuti
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	log.Println("Server berjalan di port 8080...")
	http.ListenAndServe(":8080", r)
}