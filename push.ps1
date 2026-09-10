# Sri Bhavani Vasavi Bhavan - Quick Push to GitHub
# Run this script anytime you want to push updates to GitHub

$ErrorActionPreference = "Stop"

# Find git from GitHub Desktop or system PATH
$gitCmd = (Get-ChildItem -Path "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
if (-not $gitCmd) {
    $gitCmd = "git"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Sri Bhavani Vasavi Bhavan - Push to GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$msg = Read-Host "Enter update message (or press Enter for 'Update PMS')"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $msg = "Update Sri Bhavani Vasavi Bhavan PMS"
}

Write-Host "`n[1/3] Staging changes..." -ForegroundColor Yellow
& $gitCmd add .

Write-Host "[2/3] Committing changes..." -ForegroundColor Yellow
& $gitCmd commit -m "$msg"

Write-Host "[3/3] Pushing to GitHub (main branch)..." -ForegroundColor Yellow
& $gitCmd push -u origin main

Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "Render will automatically start building and deploying the update." -ForegroundColor Green
Read-Host "Press Enter to exit"
