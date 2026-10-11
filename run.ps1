#!/usr/bin/env pwsh
# ============================================================
# NayanSaathi — Implementation Runner Script (run.ps1)
# ============================================================
# Usage:
#   1. Open PowerShell in the project folder
#   2. Run: pwsh run.ps1
#      OR: .\run.ps1
# ============================================================

$ProjectPath = "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"
$ExpoToken   = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"
$ExpoAccount = "ranveer01"
$GitHubRepo  = "https://github.com/krishkhandwala/NayanSaathi.git"

# ---- Helpers ------------------------------------------------
function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  NayanSaathi Dev Runner" -ForegroundColor Cyan
    Write-Host "  Expo Account : $ExpoAccount" -ForegroundColor Cyan
    Write-Host "  GitHub       : $GitHubRepo" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Set-ExpoAuth {
    $env:EXPO_TOKEN = $ExpoToken
    Write-Host "[OK] EXPO_TOKEN set for ranveer01" -ForegroundColor Green
}

function Get-WifiIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 `
           | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -and $_.IPAddress -notlike "169.254*" } `
           | Select-Object -ExpandProperty IPAddress -First 1)
    if (-not $ip) { $ip = "192.168.10.9" }
    return $ip
}

function Ensure-NodeModules {
    if (-not (Test-Path "$ProjectPath\node_modules")) {
        Write-Host "[!] node_modules not found -- running npm install..." -ForegroundColor Yellow
        npm install --legacy-peer-deps
    }
}

# ---- Menu ---------------------------------------------------
function Show-Menu {
    Write-Host "  Select an option:" -ForegroundColor White
    Write-Host ""
    Write-Host "  [1]  First-time setup (npm install + verify login)"     -ForegroundColor Yellow
    Write-Host "  [2]  Run on Laptop  -- browser at localhost:8081"       -ForegroundColor Green
    Write-Host "  [3]  Run on Phone   -- same Wi-Fi (LAN mode)"          -ForegroundColor Green
    Write-Host "  [4]  Run on Phone   -- any network (Tunnel mode)"      -ForegroundColor Green
    Write-Host "  [5]  Run all Tests (36 unit tests)"                     -ForegroundColor Magenta
    Write-Host "  [6]  Type Check (TypeScript -- 0 errors expected)"      -ForegroundColor Magenta
    Write-Host "  [7]  Push changes to GitHub"                            -ForegroundColor Blue
    Write-Host "  [8]  Pull latest from GitHub"                           -ForegroundColor Blue
    Write-Host "  [0]  Exit"                                              -ForegroundColor Red
    Write-Host ""
}

# ---- Actions ------------------------------------------------

function Run-Setup {
    Write-Host "`n[SETUP] Installing dependencies..." -ForegroundColor Cyan
    Set-Location $ProjectPath
    npm install --legacy-peer-deps

    Write-Host "`n[SETUP] Persisting EXPO_TOKEN to user environment..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable('EXPO_TOKEN', $ExpoToken, 'User')
    Set-ExpoAuth

    Write-Host "`n[SETUP] Verifying Expo account..." -ForegroundColor Cyan
    $who = npx expo whoami 2>&1
    if ($who -match $ExpoAccount) {
        Write-Host "[OK] Logged in as: $who" -ForegroundColor Green
    } else {
        Write-Host "[!] Could not verify. Got: $who" -ForegroundColor Red
    }

    Write-Host "`n[SETUP] Running test suite..." -ForegroundColor Cyan
    npm test
}

function Run-Laptop {
    Write-Host "`n[LAPTOP] Starting Expo dev server" -ForegroundColor Cyan
    Write-Host "         Open Chrome at: http://localhost:8081" -ForegroundColor White
    Write-Host "         Press Ctrl+C to stop.`n" -ForegroundColor White
    Set-Location $ProjectPath
    Set-ExpoAuth
    Ensure-NodeModules
    npx expo start -c
}

function Run-PhoneLAN {
    $ip = Get-WifiIP
    Write-Host "`n[PHONE/LAN] Wi-Fi IP detected: $ip" -ForegroundColor Cyan
    Write-Host "            Open Expo Go -> 'Enter URL manually'" -ForegroundColor White
    Write-Host "            Enter: exp://${ip}:8081`n" -ForegroundColor Yellow
    Set-Location $ProjectPath
    Set-ExpoAuth
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
    Ensure-NodeModules
    npx expo start --lan -c
}

function Run-PhoneTunnel {
    Write-Host "`n[PHONE/TUNNEL] Starting ngrok tunnel (works on any network)" -ForegroundColor Cyan
    Write-Host "               Look for 'exp://xxxx.exp.direct' in terminal output" -ForegroundColor White
    Write-Host "               Enter that URL in Expo Go -> 'Enter URL manually'`n" -ForegroundColor White
    Set-Location $ProjectPath
    Set-ExpoAuth
    Ensure-NodeModules
    npx expo start --tunnel -c
}

function Run-Tests {
    Write-Host "`n[TESTS] Running all 36 unit tests..." -ForegroundColor Cyan
    Set-Location $ProjectPath
    npm test
}

function Run-TypeCheck {
    Write-Host "`n[TYPECHECK] Running TypeScript check (0 errors expected)..." -ForegroundColor Cyan
    Set-Location $ProjectPath
    npm run typecheck
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] No TypeScript errors." -ForegroundColor Green
    } else {
        Write-Host "[!] TypeScript errors detected. See above." -ForegroundColor Red
    }
}

function Run-GitPush {
    Set-Location $ProjectPath
    Write-Host "`n[GIT] Current status:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    $msg = Read-Host "Enter commit message (press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "chore: update NayanSaathi"
    }
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "[OK] Pushed to $GitHubRepo" -ForegroundColor Green
}

function Run-GitPull {
    Write-Host "`n[GIT] Pulling latest from GitHub..." -ForegroundColor Cyan
    Set-Location $ProjectPath
    git pull origin main
    npm install --legacy-peer-deps
    Write-Host "[OK] Up to date." -ForegroundColor Green
}

# ---- Main Loop ----------------------------------------------
Write-Header
Set-Location $ProjectPath

while ($true) {
    Show-Menu
    $choice = Read-Host "  Enter choice"

    switch ($choice) {
        "1" { Run-Setup }
        "2" { Run-Laptop }
        "3" { Run-PhoneLAN }
        "4" { Run-PhoneTunnel }
        "5" { Run-Tests }
        "6" { Run-TypeCheck }
        "7" { Run-GitPush }
        "8" { Run-GitPull }
        "0" { Write-Host "`nExiting. Bye!`n" -ForegroundColor Cyan; exit 0 }
        default { Write-Host "`n[!] Invalid. Enter 0-8.`n" -ForegroundColor Red }
    }

    Write-Host ""
    Write-Host "Press Enter to return to the menu..." -ForegroundColor Gray
    Read-Host
    Write-Header
}
