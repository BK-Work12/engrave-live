# Image Processing Tools Installation Guide (Windows)

## Required Tools
The Laravel backend needs three CLI tools for image processing:
1. **ImageMagick** - Image manipulation and format conversion
2. **librsvg (rsvg-convert)** - SVG to PNG conversion
3. **potrace** - Bitmap to SVG tracing

## Installation Methods

### Option 1: Using Chocolatey (Recommended)

#### Install Chocolatey (if not already installed)
Open PowerShell as Administrator:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Install Tools
```powershell
# Install ImageMagick
choco install imagemagick -y

# Install librsvg (includes rsvg-convert)
choco install rsvg-convert -y

# Install potrace
choco install potrace -y

# Refresh environment variables
refreshenv
```

#### Verify Installation
```powershell
magick --version
rsvg-convert --version
potrace --version
```

---

### Option 2: Manual Installation

#### ImageMagick
1. Download from: https://imagemagick.org/script/download.php#windows
2. Choose: `ImageMagick-7.x.x-Q16-HDRI-x64-dll.exe`
3. Run installer
4. ✅ **Important**: Check "Add application directory to your system path"
5. ✅ **Important**: Check "Install legacy utilities (e.g., convert)"

After installation, verify:
```powershell
magick --version
```

If not found, add to PATH manually:
- Default location: `C:\Program Files\ImageMagick-7.x.x-Q16-HDRI`
- Add to System Environment Variables → Path

#### librsvg (rsvg-convert)
1. Download GTK bundle from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
2. Run installer: `gtk3-runtime-x.x.x-x-x-ts-win64.exe`
3. Follow installation wizard
4. Add to PATH: `C:\Program Files\GTK3-Runtime Win64\bin`

Verify:
```powershell
rsvg-convert --version
```

#### potrace
1. Download from: http://potrace.sourceforge.net/#downloading
2. Extract ZIP to: `C:\Program Files\potrace`
3. Add to PATH: `C:\Program Files\potrace`

Verify:
```powershell
potrace --version
```

---

### Option 3: Using MSYS2/MinGW (Advanced)

```bash
# Install MSYS2 from https://www.msys2.org/

# Update package database
pacman -Syu

# Install tools
pacman -S mingw-w64-x86_64-imagemagick
pacman -S mingw-w64-x86_64-librsvg
pacman -S mingw-w64-x86_64-potrace

# Add to PATH: C:\msys64\mingw64\bin
```

---

## Configure Laravel .env

After installation, update your `.env` file:

```env
# If tools are in system PATH:
IMAGEMAGICK_BIN=magick
RSVG_CONVERT_BIN=rsvg-convert

# If custom installation paths (Windows):
# IMAGEMAGICK_BIN="C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"
# RSVG_CONVERT_BIN="C:\Program Files\GTK3-Runtime Win64\bin\rsvg-convert.exe"
```

**Note**: potrace doesn't need configuration since it's called directly by ImageProcessingService

---

## Testing Installation

Create `test-tools.php` in Laravel root:

```php
<?php
$tools = [
    'magick' => 'magick --version',
    'rsvg-convert' => 'rsvg-convert --version',
    'potrace' => 'potrace --version',
];

foreach ($tools as $name => $command) {
    echo "Testing $name...\n";
    exec($command . ' 2>&1', $output, $returnCode);
    
    if ($returnCode === 0) {
        echo "✅ $name is working\n";
        echo "   " . ($output[0] ?? '') . "\n\n";
    } else {
        echo "❌ $name not found or error\n";
        echo "   " . implode("\n   ", $output) . "\n\n";
    }
    
    $output = [];
}
```

Run:
```powershell
php test-tools.php
```

---

## Quick Setup Script (PowerShell)

Save as `install-image-tools.ps1`:

```powershell
# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install tools
Write-Host "Installing ImageMagick..." -ForegroundColor Yellow
choco install imagemagick -y

Write-Host "Installing librsvg..." -ForegroundColor Yellow
choco install rsvg-convert -y

Write-Host "Installing potrace..." -ForegroundColor Yellow
choco install potrace -y

# Refresh environment
refreshenv

# Test installations
Write-Host "`nTesting installations..." -ForegroundColor Green
Write-Host "ImageMagick:" -ForegroundColor Cyan
& magick --version

Write-Host "`nlibrsvg:" -ForegroundColor Cyan
& rsvg-convert --version

Write-Host "`npotrace:" -ForegroundColor Cyan
& potrace --version

Write-Host "`n✅ All tools installed successfully!" -ForegroundColor Green
```

Run as Administrator:
```powershell
powershell -ExecutionPolicy Bypass -File install-image-tools.ps1
```

---

## Troubleshooting

### "magick not recognized"
- Restart your terminal/IDE after installation
- Verify PATH with: `echo $env:Path`
- Try full path in .env: `IMAGEMAGICK_BIN="C:\Program Files\ImageMagick-7.x.x\magick.exe"`

### "DLL not found" errors
- Install Visual C++ Redistributables: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Restart computer after installation

### rsvg-convert crashes
- Ensure GTK3 Runtime is fully installed
- Check Windows Event Viewer for DLL errors
- Try different GTK3 version

### PATH not updating
- Close and reopen terminal
- Restart VS Code
- Log out and log back in to Windows

---

## Alternative: Docker (Skip CLI Installation)

If CLI installation is problematic, consider running image processing in Docker:

```yaml
# docker-compose.yml
services:
  image-processor:
    image: dpokidov/imagemagick:7-latest
    volumes:
      - ./storage/app/public:/workspace
```

Would require modifying ImageProcessingService to use Docker exec instead of direct CLI calls.

---

## Success Criteria

You should see output like this:

```
PS> magick --version
Version: ImageMagick 7.1.1-38 Q16-HDRI x64

PS> rsvg-convert --version
rsvg-convert version 2.54.4

PS> potrace --version
potrace 1.16
```

Once all three commands work, your Laravel backend is ready to process images!
