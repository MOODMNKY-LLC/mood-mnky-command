# Add uv's .local\bin to user PATH if not already present
$localBin = Join-Path $env:USERPROFILE ".local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$localBin*") {
  [Environment]::SetEnvironmentVariable("Path", "$localBin;$userPath", "User")
  Write-Host "Added to user PATH: $localBin"
} else {
  Write-Host "User PATH already contains: $localBin"
}
