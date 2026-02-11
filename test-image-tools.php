<?php
/**
 * Quick Test Script for Image Processing Tools
 * Run: php test-image-tools.php
 */

echo "\n=== Testing Image Processing Tools ===\n\n";

// Test tools availability
$tools = [
    'ImageMagick' => 'magick --version',
    'rsvg-convert' => 'rsvg-convert --version',
    'potrace' => 'potrace --version',
];

$allWorking = true;

foreach ($tools as $name => $command) {
    echo "Testing $name...\n";
    exec($command . ' 2>&1', $output, $returnCode);
    
    if ($returnCode === 0) {
        echo "✅ $name is working\n";
        echo "   " . ($output[0] ?? 'Version info not available') . "\n";
    } else {
        echo "❌ $name not found or not working\n";
        if (!empty($output)) {
            echo "   Error: " . implode("\n   ", $output) . "\n";
        }
        $allWorking = false;
    }
    
    echo "\n";
    $output = [];
}

// Test .env configuration if inside Laravel
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "=== Testing Laravel Configuration ===\n\n";
    
    require __DIR__.'/vendor/autoload.php';
    $app = require_once __DIR__.'/bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    
    // Test config values
    $geminiKey = config('services.gemini.key');
    $geminiModel = config('services.gemini.model');
    $magickBin = config('services.image_tools.magick');
    $rsvgBin = config('services.image_tools.rsvg');
    
    echo "GEMINI_API_KEY: " . ($geminiKey ? '✅ Set (' . strlen($geminiKey) . ' chars)' : '❌ Not set') . "\n";
    echo "GEMINI_MODEL: " . ($geminiModel ?: '❌ Not set') . "\n";
    echo "IMAGEMAGICK_BIN: " . ($magickBin ?: '❌ Not set') . "\n";
    echo "RSVG_CONVERT_BIN: " . ($rsvgBin ?: '❌ Not set') . "\n\n";
    
    // Test service instantiation
    try {
        $geminiService = app(\App\Services\GeminiService::class);
        echo "✅ GeminiService instantiated successfully\n";
    } catch (\Exception $e) {
        echo "❌ GeminiService error: " . $e->getMessage() . "\n";
        $allWorking = false;
    }
    
    try {
        $imageService = app(\App\Services\ImageProcessingService::class);
        echo "✅ ImageProcessingService instantiated successfully\n";
    } catch (\Exception $e) {
        echo "❌ ImageProcessingService error: " . $e->getMessage() . "\n";
        $allWorking = false;
    }
    
    try {
        $svgService = app(\App\Services\SvgToolService::class);
        echo "✅ SvgToolService instantiated successfully\n";
    } catch (\Exception $e) {
        echo "❌ SvgToolService error: " . $e->getMessage() . "\n";
        $allWorking = false;
    }
    
    echo "\n";
    
    // Test storage directory
    $uploadsPath = storage_path('app/public/uploads');
    if (!is_dir($uploadsPath)) {
        echo "⚠️  Uploads directory not found: $uploadsPath\n";
        echo "   Creating directory...\n";
        mkdir($uploadsPath, 0755, true);
        echo "   ✅ Directory created\n\n";
    } else {
        echo "✅ Uploads directory exists: $uploadsPath\n\n";
    }
    
    // Check if storage is linked
    $publicLink = public_path('storage');
    if (!file_exists($publicLink)) {
        echo "⚠️  Storage not linked to public directory\n";
        echo "   Run: php artisan storage:link\n\n";
    } else {
        echo "✅ Storage linked to public directory\n\n";
    }
}

// Summary
echo "=== Summary ===\n";
if ($allWorking) {
    echo "✅ All systems ready!\n";
    echo "\nNext steps:\n";
    echo "1. Run: php artisan serve\n";
    echo "2. Visit: http://localhost:8000/seamless-patterns\n";
    echo "3. Test pattern generation workflow\n\n";
} else {
    echo "⚠️  Some components need attention\n";
    echo "\nSetup steps:\n";
    echo "1. Install missing CLI tools (see INSTALL_IMAGE_TOOLS.md)\n";
    echo "2. Configure .env with GEMINI_API_KEY\n";
    echo "3. Run this script again to verify\n\n";
}

echo "For detailed setup, see: MIGRATION_COMPLETE.md\n\n";
