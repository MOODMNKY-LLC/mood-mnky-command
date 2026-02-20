# Generate locally-trusted TLS certs for Supabase using mkcert.
# Run once after installing mkcert. Fixes "self-signed certificate" on login.
#
# Install mkcert (one-time):
#   winget install mkcert
#   # or: choco install mkcert
#   mkcert -install
#
# Then run: .\scripts\gen-supabase-certs.ps1

$ErrorActionPreference = "Stop"
$certsDir = Join-Path $PSScriptRoot ".." "certs"
$certFile = Join-Path $certsDir "supabase-cert.pem"
$keyFile = Join-Path $certsDir "supabase-key.pem"

New-Item -ItemType Directory -Force -Path $certsDir | Out-Null

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "mkcert not found. Install it first:" -ForegroundColor Yellow
    Write-Host "  winget install mkcert"
    Write-Host "  mkcert -install"
    exit 1
}

Write-Host "Generating locally-trusted certs for 127.0.0.1, localhost..."
mkcert -cert-file $certFile -key-file $keyFile 127.0.0.1 localhost

Write-Host "Done. Certs written to certs/" -ForegroundColor Green
Write-Host "Restart Supabase: supabase stop && supabase start"
