# Import data dari PostgreSQL lokal (hr_leave_db) ke Neon.
# Pastikan di Neon sudah ada schema (tabel) — skrip ini hanya mengisi DATA (--data-only).
#
# Cara pakai (PowerShell):
#   cd C:\Users\LENOVO\hr-leave-system
#   .\scripts\import-local-to-neon.ps1
#
# Atau jika execution policy blokir:
#   powershell -ExecutionPolicy Bypass -File .\scripts\import-local-to-neon.ps1

$ErrorActionPreference = "Stop"

# ========== EDIT BAGIAN INI ==========
$LocalHost  = "localhost"
$LocalPort  = "5432"
$LocalUser  = "postgres"
$LocalPass  = "postgres123"
$LocalDb    = "hr_leave_db"

# URL DIRECT Neon (tanpa -pooler). Ganti PASSWORD dengan password Neon kamu.
# Contoh host: ep-broad-dust-aoqihyeb.c-2.ap-southeast-1.aws.neon.tech
$NeonDirectUrl = "postgresql://neondb_owner:PASSWORD@ep-broad-dust-aoqihyeb.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

$BackupDir  = "C:\backup"
$BackupFile = Join-Path $BackupDir "hr_leave_db_data.dump"
# ======================================

if ($NeonDirectUrl -match "PASSWORD") {
    Write-Host "ERROR: Ganti PASSWORD di variabel `$NeonDirectUrl dengan password Neon yang benar." -ForegroundColor Red
    exit 1
}

foreach ($cmd in @("pg_dump", "pg_restore")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$cmd' tidak ditemukan di PATH. Pastikan PostgreSQL bin sudah di PATH (mis. C:\Program Files\PostgreSQL\18\bin)." -ForegroundColor Red
        exit 1
    }
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

Write-Host "== 1/2 pg_dump (data only) dari lokal ==" -ForegroundColor Cyan
$env:PGPASSWORD = $LocalPass
try {
    & pg_dump -h $LocalHost -p $LocalPort -U $LocalUser -d $LocalDb -Fc --data-only -f $BackupFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump exit $LASTEXITCODE" }
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Dump tersimpan: $BackupFile" -ForegroundColor Green

Write-Host "== 2/2 pg_restore (data only) ke Neon ==" -ForegroundColor Cyan
& pg_restore --verbose --data-only --no-owner --no-acl -d $NeonDirectUrl $BackupFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "pg_restore selesai dengan kode $LASTEXITCODE (kadang ada peringatan tapi data tetap masuk). Cek COUNT di Neon SQL Editor." -ForegroundColor Yellow
} else {
    Write-Host "pg_restore selesai OK." -ForegroundColor Green
}

Write-Host ""
Write-Host "Di Neon SQL Editor, jalankan:" -ForegroundColor Cyan
Write-Host "  SELECT COUNT(*) FROM users;"
Write-Host "  SELECT COUNT(*) FROM employees;"
Write-Host "  SELECT COUNT(*) FROM leave_requests;"
