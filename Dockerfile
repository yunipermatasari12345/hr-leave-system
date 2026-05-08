# Tahap 1: Build Frontend (React)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy dependency file
COPY frontend/package*.json ./
RUN npm install
# Copy sisa kode frontend dan build
COPY frontend/ ./
RUN npm run build

# Tahap 2: Build Backend (Go)
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app/backend
# Copy dependency file
COPY backend/go.mod backend/go.sum ./
RUN go mod download
# Copy sisa kode backend dan build
COPY backend/ ./
# Build binary Go-nya
RUN go build -o main .

# Tahap 3: Final Image
FROM alpine:latest
WORKDIR /app

# Pastikan folder uploads tersedia untuk lampiran
RUN mkdir -p /app/backend/uploads

# Copy hasil build frontend dari stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy hasil build backend dari stage 2
COPY --from=backend-builder /app/backend/main /app/backend/main

# Set timezone untuk alpine jika diperlukan, optional
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

# Expose port (Render akan mendeteksi port 8080 secara otomatis)
EXPOSE 8080

# Jalankan server
WORKDIR /app/backend
CMD ["./main"]
