package main

import (
	"hr-leave-system/config"
	"hr-leave-system/internal/handlers"
	mw "hr-leave-system/internal/middleware"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	config.InitDB()

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
	r.Get("/api/leave-types", handlers.GetLeaveTypes)

	// Route butuh login
	r.Group(func(r chi.Router) {
		r.Use(mw.JWTMiddleware)

		// Karyawan
		r.Get("/api/employee/leaves", handlers.GetMyLeaves)
		r.Post("/api/employee/leaves", handlers.CreateLeaveRequest_)

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

	log.Println("Server berjalan di port 8080...")
	http.ListenAndServe(":8080", r)
}