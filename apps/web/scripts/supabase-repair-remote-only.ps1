<#
.SYNOPSIS
  Reverts remote-only migration versions in batches so supabase db push can succeed.
.DESCRIPTION
  Use when supabase db push fails with "Remote migration versions not found in local".
  Reads migration versions from a file or stdin, runs supabase migration repair --status reverted
  in batches (default 50 per call) to avoid CLI limits.
.PARAMETER VersionsFile
  Path to file with one version per line (e.g. output of SQL query for remote-only versions).
  If omitted, reads from pipeline/stdin.
.PARAMETER ChunkSize
  Number of versions per repair call (default 50).
.PARAMETER DryRun
  Print commands only, do not execute.
.EXAMPLE
  .\supabase-repair-remote-only.ps1 -VersionsFile remote_only_versions.txt
.EXAMPLE
  Get-Content remote_only_versions.txt | .\supabase-repair-remote-only.ps1 -DryRun
#>
[CmdletBinding()]
param(
  [Parameter(ValueFromPipelineByPropertyName = $true)]
  [string]$VersionsFile,

  [int]$ChunkSize = 50,

  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$versions = @()
if ($VersionsFile) {
  if (-not (Test-Path $VersionsFile)) {
    Write-Error "File not found: $VersionsFile"
  }
  $versions = (Get-Content $VersionsFile) | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d{14}$' }
} else {
  $versions = @($input) | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ -match '^\d{14}$' }
}

if ($versions.Count -eq 0) {
  Write-Warning "No valid 14-digit migration versions found. Nothing to do."
  exit 0
}

Write-Host "Found $($versions.Count) version(s) to revert in chunks of $ChunkSize."
if ($DryRun) {
  Write-Host "[DRY RUN]"
}

$chunks = [System.Collections.ArrayList]@()
for ($i = 0; $i -lt $versions.Count; $i += $ChunkSize) {
  $end = [Math]::Min($i + $ChunkSize - 1, $versions.Count - 1)
  $chunk = $versions[$i..$end]
  [void]$chunks.Add($chunk)
}

$chunkNum = 0
foreach ($chunk in $chunks) {
  $chunkNum++
  $repairArgs = @('migration', 'repair', '--linked', '--status', 'reverted') + @($chunk)
  if ($DryRun) {
    Write-Host "Would run: supabase $($repairArgs -join ' ')"
  } else {
    Write-Host "Chunk $chunkNum/$($chunks.Count): reverting $($chunk.Count) version(s)..."
    & supabase @repairArgs
    if ($LASTEXITCODE -ne 0) {
      Write-Error "repair failed with exit code $LASTEXITCODE"
    }
  }
}

Write-Host "Done."
if (-not $DryRun) {
  Write-Host "Next: run 'supabase migration list --linked' to verify, then 'supabase db push'."
}
