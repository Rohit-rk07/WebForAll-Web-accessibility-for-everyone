# Registers Windows Scheduled Tasks for the daily MongoDB backup and the
# monthly retention cleanup. Idempotent: re-running overwrites both tasks.
#
#   powershell -ExecutionPolicy Bypass -File .\schedule.ps1
#   powershell -ExecutionPolicy Bypass -File .\schedule.ps1 -Uninstall
#
# Uses the app's own interpreter (server/venv if present) so pymongo and
# python-dotenv are available. See OPERATIONS.md -> Backup & Restore.

param([switch]$Uninstall)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupDir = Join-Path $root "backups"

if (Test-Path (Join-Path $root "venv\Scripts\python.exe")) {
    $py = Join-Path $root "venv\Scripts\python.exe"
} else {
    $cmd = Get-Command python -ErrorAction SilentlyContinue | Select-Object -First 1
    $py = if ($cmd) { $cmd.Source } else { $null }
}

if ($Uninstall) {
    schtasks /Delete /TN "WebForAll-MongoBackup" /F | Out-Null
    schtasks /Delete /TN "WebForAll-MongoRetention" /F | Out-Null
    Write-Host "Removed WebForAll-MongoBackup and WebForAll-MongoRetention."
    return
}

if (-not $py) { Write-Error "python interpreter not found"; exit 1 }

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$backupCmd = '"' + $py + '" "' + (Join-Path $PSScriptRoot "backup_db.py") + '" --out "' + $backupDir + '" --keep 30'
$retentionCmd = '"' + $py + '" "' + (Join-Path $PSScriptRoot "retention.py") + '" --days 90 --apply'

schtasks /Create /F /TN "WebForAll-MongoBackup" /SC DAILY /ST 02:00 /TR $backupCmd | Out-Null
schtasks /Create /F /TN "WebForAll-MongoRetention" /SC MONTHLY /MO 1 /D 1 /ST 03:00 /TR $retentionCmd | Out-Null

Write-Host "Scheduled:"
Write-Host "  WebForAll-MongoBackup    daily 02:00  -> $backupDir (keep 30)"
Write-Host "  WebForAll-MongoRetention monthly 03:00 -> purge analyses older than 90 days"
Write-Host "Verify: schtasks /Query /TN WebForAll-MongoBackup"