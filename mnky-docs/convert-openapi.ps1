#!/usr/bin/env pwsh

# Install @mintlify/scraping using pnpm
pnpm add -g @mintlify/scraping

# Create api-reference directory if it doesn't exist
if (-not (Test-Path "docs/api-reference")) {
    New-Item -Path "docs/api-reference" -ItemType Directory
}

# Process all YAML and JSON files in the specified directories
$openApiFiles = @(
    Get-ChildItem -Path "docs/api/openapi/*.yaml" -ErrorAction SilentlyContinue
    Get-ChildItem -Path "docs/api/openapi/*.json" -ErrorAction SilentlyContinue
    Get-ChildItem -Path "docs/api-specs/*/*.yaml" -ErrorAction SilentlyContinue 
    Get-ChildItem -Path "docs/api-specs/*/*.json" -ErrorAction SilentlyContinue
)

foreach ($file in $openApiFiles) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    Write-Host "Processing $($file.FullName) to docs/api-reference/$name"
    npx @mintlify/scraping@latest openapi-file $file.FullName -o "docs/api-reference/$name"
}

Write-Host "Conversion complete! Generated files are in docs/api-reference/"