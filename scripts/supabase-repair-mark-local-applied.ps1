<#
.SYNOPSIS
  Marks local-only migration versions as applied on remote.
.DESCRIPTION
  Use after reverting remote-only versions. Scans supabase/migrations/*.sql,
  extracts timestamps, and runs supabase migration repair --status applied for each
  version that exists locally (skips run_verse_blog_on_production.sql - non-standard name).
.PARAMETER DryRun
  Print commands only, do not execute.
.EXAMPLE
  .\supabase-repair-mark-local-applied.ps1
  .\supabase-repair-mark-local-applied.ps1 -DryRun
#>
[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$migrationsDir = Join-Path $PSScriptRoot '..' 'supabase' 'migrations'
if (-not (Test-Path $migrationsDir)) {
  Write-Error "Migrations directory not found: $migrationsDir"
}

$files = Get-ChildItem -Path $migrationsDir -Filter '*.sql' -File | Where-Object {
  $_.Name -match '^(\d{14})_'  # Standard pattern: timestamp_name.sql
}

$versions = $files | ForEach-Object {
  if ($_.Name -match '^(\d{14})_') { $Matches[1] }
} | Sort-Object -Unique

if ($versions.Count -eq 0) {
  Write-Warning "No migration files matching pattern <timestamp>_name.sql found."
  exit 0
}

Write-Host "Found $($versions.Count) local migration version(s) to mark as applied."
if ($DryRun) { Write-Host "[DRY RUN]" }

if ($DryRun) {
  foreach ($v in $versions) {
    Write-Host "Would run: supabase migration repair --linked --status applied $v"
  }
} else {
  $repairArgs = @('migration', 'repair', '--linked', '--status', 'applied') + @($versions)
  Write-Host "Marking $($versions.Count) version(s) as applied..."
  & supabase @repairArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Error "repair failed with exit code $LASTEXITCODE"
  }
}

Write-Host "Done."
if (-not $DryRun) {
  Write-Host "Next: supabase migration list --linked && supabase db push"
}
