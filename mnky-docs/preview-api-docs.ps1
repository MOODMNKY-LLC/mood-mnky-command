#!/usr/bin/env pwsh

# Install Mintlify CLI if not already installed
if (-not (Get-Command mintlify -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Mintlify CLI..."
    pnpm add -g mintlify
}

# Navigate to the docs directory
Set-Location -Path "docs"

# Run the Mintlify preview
Write-Host "Starting Mintlify preview server..."
Write-Host "Access your API documentation at http://localhost:3000"
mintlify dev