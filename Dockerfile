# Build Backend (Go)
# Cache-bust: 2026-05-08T15:40
FROM golang:alpine AS backend-builder
WORKDIR /app/backend
# Copy dependency file
COPY backend/go.mod backend/go.sum ./
RUN go mod download
# Copy sisa kode backend dan build
COPY backend/ ./
RUN go build -o main main.go

# Final Stage (Lightweight)
FROM alpine:latest
WORKDIR /app
# Ambil binary dari builder
COPY --from=backend-builder /app/backend/main .
# Pastikan folder uploads ada
RUN mkdir -p uploads
# Expose port
EXPOSE 8080
# Jalankan aplikasi
CMD ["./main"]
