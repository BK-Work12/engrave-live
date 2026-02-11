# Image Processing Tools Installation Script
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install-image-tools.ps1

Write-Host "`n=== Image Processing Tools Installation ===" -ForegroundColor Cyan
Write-Host "Installing: ImageMagick, librsvg, potrace`n" -ForegroundColor White

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) {
    Write-Host "⚠️  WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some installations may fail. Please run as Administrator.`n" -ForegroundColor Yellow
}

# Check if Chocolatey is installed
Write-Host "Checking for Chocolatey..." -ForegroundColor Yellow
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Chocolatey not found. Installing Chocolatey..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Chocolatey: $_" -ForegroundColor Red
        Write-Host "Please install manually from: https://chocolatey.org/install`n" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Chocolatey is installed`n" -ForegroundColor Green
}

# Install ImageMagick
Write-Host "Installing ImageMagick..." -ForegroundColor Yellow
try {
    choco install imagemagick -y --no-progress
    Write-Host "✅ ImageMagick installed`n" -ForegroundColor Green
} catch {
    Write-Host "❌ ImageMagick installation failed: $_`n" -ForegroundColor Red
}

# Install librsvg
Write-Host "Installing librsvg (rsvg-convert)..." -ForegroundColor Yellow
try {
    choco install rsvg-convert -y --no-progress
    Write-Host "✅ librsvg installed`n" -ForegroundColor Green
} catch {
    Write-Host "❌ librsvg installation failed: $_" -ForegroundColor Red
    Write-Host "   Note: This package may not be available in main Chocolatey repo`n" -ForegroundColor Yellow
}

# Install potrace
Write-Host "Installing potrace..." -ForegroundColor Yellow
try {
    choco install potrace -y --no-progress
    Write-Host "✅ potrace installed`n" -ForegroundColor Green
} catch {
    Write-Host "❌ potrace installation failed: $_" -ForegroundColor Red
    Write-Host "   Note: This package may not be available in main Chocolatey repo`n" -ForegroundColor Yellow
}

# Refresh environment variables
Write-Host "Refreshing environment variables..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "✅ Environment refreshed`n" -ForegroundColor Green

# Test installations
Write-Host "=== Testing Installations ===`n" -ForegroundColor Cyan

$allSuccess = $true

# Test ImageMagick
Write-Host "Testing ImageMagick (magick):" -ForegroundColor Yellow
try {
    $version = & magick --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ImageMagick is working" -ForegroundColor Green
        Write-Host "   $($version[0])`n" -ForegroundColor Gray
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ ImageMagick not found in PATH" -ForegroundColor Red
    Write-Host "   You may need to restart your terminal or add to PATH manually`n" -ForegroundColor Yellow
    $allSuccess = $false
}

# Test librsvg
Write-Host "Testing librsvg (rsvg-convert):" -ForegroundColor Yellow
try {
    $version = & rsvg-convert --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ rsvg-convert is working" -ForegroundColor Green
        Write-Host "   $version`n" -ForegroundColor Gray
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ rsvg-convert not found in PATH" -ForegroundColor Red
    Write-Host "   Install GTK3 Runtime manually: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases`n" -ForegroundColor Yellow
    $allSuccess = $false
}

# Test potrace
Write-Host "Testing potrace:" -ForegroundColor Yellow
try {
    $version = & potrace --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ potrace is working" -ForegroundColor Green
        Write-Host "   $version`n" -ForegroundColor Gray
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ potrace not found in PATH" -ForegroundColor Red
    Write-Host "   Download manually: http://potrace.sourceforge.net/#downloading`n" -ForegroundColor Yellow
    $allSuccess = $false
}

# Summary
Write-Host "=== Installation Summary ===" -ForegroundColor Cyan
if ($allSuccess) {
    Write-Host "✅ All tools installed and working!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "1. Restart your terminal/IDE to ensure PATH is updated" -ForegroundColor White
    Write-Host "2. Verify .env has: IMAGEMAGICK_BIN=magick and RSVG_CONVERT_BIN=rsvg-convert" -ForegroundColor White
    Write-Host "3. Run: php artisan serve" -ForegroundColor White
    Write-Host "4. Visit: http://localhost:8000/seamless-patterns`n" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tools failed to install" -ForegroundColor Yellow
    Write-Host "   See INSTALL_IMAGE_TOOLS.md for manual installation instructions" -ForegroundColor White
    Write-Host "   Or try restarting terminal and running this script again`n" -ForegroundColor White
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
