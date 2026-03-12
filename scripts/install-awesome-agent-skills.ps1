# Install all Awesome Agent Skills for Cursor (.cursor/skills/)
# See: https://github.com/skillcreatorai/Awesome-Agent-Skills
# Run from repo root: .\scripts\install-awesome-agent-skills.ps1

$ErrorActionPreference = "Stop"
$skills = @(
    "docx", "pdf", "pptx", "xlsx",
    "artifacts-builder", "mcp-builder", "skill-creator", "webapp-testing", "changelog-generator",
    "frontend-design", "code-review", "code-refactoring", "backend-development", "python-development", "javascript-typescript",
    "database-design",
    "brand-guidelines", "competitive-ads-extractor", "domain-name-brainstormer", "internal-comms", "lead-research-assistant", "job-application",
    "content-research-writer", "meeting-insights-analyzer", "code-documentation",
    "canvas-design", "image-enhancer", "slack-gif-creator", "theme-factory", "video-downloader", "algorithmic-art",
    "file-organizer", "invoice-organizer", "raffle-winner-picker", "jira-issues", "qa-regression", "llm-application-dev"
)

$total = $skills.Count
$i = 0
foreach ($name in $skills) {
    $i++
    Write-Host "[$i/$total] Installing $name ..." -ForegroundColor Cyan
    npx ai-agent-skills install $name --agent cursor
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed: $name" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}
Write-Host "Done. $total skills installed to .cursor/skills/" -ForegroundColor Green
