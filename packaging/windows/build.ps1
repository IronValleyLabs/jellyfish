# Build Jellyfish for Windows. Run from repo root: .\packaging\windows\build.ps1
# Produces: packaging\out\windows\Jellyfish\ (folder + zip). Double-click "Run Jellyfish.bat" to start.
$ErrorActionPreference = "Stop"
$NODE_VERSION = "20.18.0"
$REPO_ROOT = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$OUT = Join-Path $REPO_ROOT "packaging\out\windows"
$BUNDLE = Join-Path $OUT "Jellyfish"
$RESOURCES = $BUNDLE
$NODE_ZIP = "node-v$NODE_VERSION-win-x64.zip"
$NODE_URL = "https://nodejs.org/dist/v$NODE_VERSION/$NODE_ZIP"
$CACHE = Join-Path $REPO_ROOT "packaging\cache"

Write-Host "Building Jellyfish for Windows..."
Write-Host "REPO_ROOT=$REPO_ROOT"
Write-Host "OUT=$OUT"
if (Test-Path $OUT) { Remove-Item -Recurse -Force $OUT }
New-Item -ItemType Directory -Force -Path $BUNDLE | Out-Null

# 1. Download and extract Node
$nodeCache = Join-Path $CACHE $NODE_ZIP
if (-not (Test-Path $nodeCache)) {
    New-Item -ItemType Directory -Force -Path $CACHE | Out-Null
    Write-Host "Downloading Node $NODE_VERSION..."
    Invoke-WebRequest -Uri $NODE_URL -OutFile $nodeCache -UseBasicParsing
}
Write-Host "Extracting Node..."
Expand-Archive -Path $nodeCache -DestinationPath $BUNDLE -Force
Rename-Item (Join-Path $BUNDLE "node-v$NODE_VERSION-win-x64") "node"

# 2. Optional embedded Redis (put redis-server.exe in packaging\resources\windows\)
$redisSrc = Join-Path $REPO_ROOT "packaging\resources\windows\redis-server.exe"
if (Test-Path $redisSrc) {
    $redisDir = Join-Path $BUNDLE "redis"
    New-Item -ItemType Directory -Force -Path $redisDir | Out-Null
    Copy-Item $redisSrc $redisDir
    Write-Host "Embedded Redis included."
} else {
    Write-Host "No packaging\resources\windows\redis-server.exe — app will use Redis from config (e.g. Redis Cloud)."
}

# 3. Build the project (skip in CI; workflow already ran pnpm install + build)
if (-not $env:CI) {
    Write-Host "Installing dependencies and building..."
    Set-Location $REPO_ROOT
    pnpm install
    pnpm build
    pnpm --filter @jellyfish/vision run build
}

# 3b. Next standalone does not include .next/static — copy it so the dashboard loads
$visionStandalone = Join-Path $REPO_ROOT "packages\vision\.next\standalone"
$visionStaticSrc = Join-Path $REPO_ROOT "packages\vision\.next\static"
$visionStaticDest = Join-Path $visionStandalone "packages\vision\.next\static"
if (Test-Path $visionStandalone) {
    Write-Host "Copying static assets into Vision standalone..."
    New-Item -ItemType Directory -Force -Path (Split-Path $visionStaticDest) | Out-Null
    Copy-Item -Path $visionStaticSrc -Destination $visionStaticDest -Recurse -Force
    $visionPublic = Join-Path $REPO_ROOT "packages\vision\public"
    if (Test-Path $visionPublic) {
        Copy-Item -Path $visionPublic -Destination (Join-Path $visionStandalone "packages\vision\public") -Recurse -Force
    }
}

# 4. Copy app (use robocopy to avoid long-path and symlink issues on Windows)
Write-Host "Copying app (robocopy)..."
$appDest = Join-Path $BUNDLE "app"
New-Item -ItemType Directory -Force -Path $appDest | Out-Null
$robocopyLog = robocopy $REPO_ROOT $appDest /E /XD .git packaging out /NFL /NDL /NJH /NJS /NC /NS /NP 2>&1
# Robocopy exit: 0-7 = OK, 8+ = failures
if ($LASTEXITCODE -ge 8) {
    Write-Host "Robocopy output (last 30 lines):"
    $robocopyLog | Select-Object -Last 30
    throw "Robocopy failed with exit $LASTEXITCODE"
}
Write-Host "Robocopy done (exit $LASTEXITCODE)"
# Remove packaging if it slipped in
$packagingInApp = Join-Path $appDest "packaging"
if (Test-Path $packagingInApp) { Remove-Item -Recurse -Force $packagingInApp }

# 4b. Copy Vision standalone (self-contained dashboard, no pnpm symlinks)
if (Test-Path $visionStandalone) {
    $visionStandaloneDest = Join-Path $BUNDLE "vision-standalone"
    Copy-Item -Path $visionStandalone -Destination $visionStandaloneDest -Recurse -Force
    Write-Host "Vision standalone copied."
}

# 5. Launcher + version (for update check)
$launcherDest = Join-Path $BUNDLE "launcher"
New-Item -ItemType Directory -Force -Path $launcherDest | Out-Null
Copy-Item (Join-Path $REPO_ROOT "packaging\launcher\index.js") $launcherDest
$versionSrc = Join-Path $REPO_ROOT "packaging\version.txt"
if (Test-Path $versionSrc) {
    Copy-Item $versionSrc $BUNDLE
} else {
    Set-Content -Path (Join-Path $BUNDLE "version.txt") -Value "1.0.0" -Encoding ASCII
}

# 6. Run script
$bat = @"
@echo off
set APP_ROOT=%~dp0
"%APP_ROOT%node\node.exe" "%APP_ROOT%launcher\index.js"
pause
"@
Set-Content -Path (Join-Path $BUNDLE "Run Jellyfish.bat") -Value $bat -Encoding ASCII

Write-Host "Done: $BUNDLE"
Write-Host "Creating zip..."
$zipPath = Join-Path $OUT "Jellyfish-win-x64.zip"
$use7z = $false
if (Get-Command 7z -ErrorAction SilentlyContinue) { $use7z = $true; Write-Host "Using 7z from PATH" }
elseif (Test-Path "C:\Program Files\7-Zip\7z.exe") { $use7z = $true; $env:PATH = "C:\Program Files\7-Zip;$env:PATH"; Write-Host "Using 7z from Program Files" }
if ($use7z) {
    $sevenZLog = & 7z a -tzip $zipPath $BUNDLE 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "7z output (last 20 lines):"
        $sevenZLog | Select-Object -Last 20
        throw "7z failed with exit $LASTEXITCODE"
    }
    Write-Host "7z completed (exit $LASTEXITCODE)"
} else {
    Write-Host "7z not found, using Compress-Archive (may fail on long paths)"
    Compress-Archive -Path $BUNDLE -DestinationPath $zipPath -Force
}
Write-Host "Zip: $zipPath"
if (Test-Path $zipPath) { Write-Host "Zip size: $((Get-Item $zipPath).Length / 1MB) MB" } else { throw "Zip file was not created" }
