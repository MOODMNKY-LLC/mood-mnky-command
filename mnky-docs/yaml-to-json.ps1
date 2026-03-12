#!/usr/bin/env pwsh

# Install required module if not present
if (-not (Get-Module -ListAvailable -Name powershell-yaml)) {
    Write-Host "Installing PowerShell-yaml module..."
    Install-Module -Name powershell-yaml -Scope CurrentUser -Force
}

# Import the YAML module
Import-Module powershell-yaml

# Function to convert YAML to JSON
function ConvertYamlToJson {
    param (
        [string]$yamlPath,
        [string]$jsonPath
    )
    
    Write-Host "Converting $yamlPath to $jsonPath"
    
    try {
        # Read YAML content
        $yamlContent = Get-Content -Path $yamlPath -Raw
        
        # Convert YAML to PowerShell object
        $yamlObject = ConvertFrom-Yaml -Yaml $yamlContent
        
        # Convert PowerShell object to JSON
        $jsonContent = $yamlObject | ConvertTo-Json -Depth 100
        
        # Save JSON content to file
        $jsonContent | Set-Content -Path $jsonPath
        Write-Host "Successfully converted to JSON"
    }
    catch {
        Write-Host "Error converting file: $_"
    }
}

# Create langchain directory if it doesn't exist
if (-not (Test-Path "docs/api-specs/langchain")) {
    New-Item -Path "docs/api-specs/langchain" -ItemType Directory
}

# Convert Langchain YAML to JSON
ConvertYamlToJson -yamlPath "docs/api/openapi/langchain.yaml" -jsonPath "docs/api-specs/langchain/langchain-api.json"

# Make sure we have the Ollama JSON file
if (-not (Test-Path "docs/api/openapi/ollama-openapi.json")) {
    Write-Host "Converting Ollama YAML to JSON"
    ConvertYamlToJson -yamlPath "docs/api/openapi/ollama.yaml" -jsonPath "docs/api/openapi/ollama-openapi.json"
}

Write-Host "YAML to JSON conversion complete!"