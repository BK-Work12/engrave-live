<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ImageProcessingService
{
    public function ensureUploadsDirectory(): string
    {
        $uploadsPath = public_path('uploads');
        
        if (!is_dir($uploadsPath)) {
            mkdir($uploadsPath, 0755, true);
        }

        return $uploadsPath;
    }

    public function processAndSaveImage(string $fileBytes, string $filename, string $targetPath, int $maxLongSide = 1500): void
    {
        if ($fileBytes === '') {
            throw new \InvalidArgumentException("Uploaded file '{$filename}' is empty.");
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if ($extension === 'svg') {
            $this->convertSvgBytesToPng($fileBytes, $targetPath, $maxLongSide);
            return;
        }

        $this->writeBytesToPath($fileBytes, $targetPath);
        $this->resizeAndFlattenPng($targetPath, $maxLongSide);
    }

    public function resizeAndFlattenPng(string $path, int $maxLongSide = 1500): void
    {
        $cmd = [
            $this->magickBinary(),
            $path,
            '-alpha', 'off',
            '-background', 'white',
            '-flatten',
            '-contrast-stretch', '0',  // Enhance contrast
            '-resize', $maxLongSide . 'x' . $maxLongSide . '>',
            $path,
        ];

        $this->runProcess($cmd, 'Image resize/flatten failed');
    }

    public function applyBorderOffset(string $path, float $offsetMm): void
    {
        if ($offsetMm <= 0) {
            return;
        }

        $pixelOffset = (int) round($offsetMm * 10);
        if ($pixelOffset <= 0) {
            return;
        }

        // Best-effort using ImageMagick CLI (dilate white into black)
        $kernel = 'Square:' . ((int) ($pixelOffset * 2 + 1));
        $cmd = [
            $this->magickBinary(),
            $path,
            '-alpha', 'off',           // Ensure no alpha channel before morphology
            '-background', 'white',    // Set white as background
            '-flatten',                // Flatten to ensure single layer
            '-colorspace', 'Gray',
            '-threshold', '50%',
            '-morphology', 'Dilate', $kernel,
            '+repage',                 // Reset virtual canvas
            '-depth', '8',             // 8-bit output
            $path,
        ];

        $this->runProcess($cmd, 'Border offset failed');
    }

    public function invertColors(string $path): void
    {
        $cmd = [
            $this->magickBinary(),
            $path,
            '-negate',
            $path,
        ];

        $this->runProcess($cmd, 'Image invert failed');
    }

    public function postProcessFill(string $path): void
    {
        $cmd = [
            $this->magickBinary(),
            $path,
            '-alpha', 'off',
            '-background', 'white',
            '-flatten',
            $path,
        ];

        $this->runProcess($cmd, 'Post-process fill failed');
    }

    public function createSvgWithEmbeddedImage(string $pngPath, string $svgPath): void
    {
        $pngData = file_get_contents($pngPath);
        if ($pngData === false) {
            throw new \RuntimeException('Failed to read PNG for SVG embedding.');
        }

        $size = getimagesizefromstring($pngData);
        if (!$size) {
            throw new \RuntimeException('Failed to read PNG dimensions.');
        }

        [$width, $height] = $size;
        $imgB64 = base64_encode($pngData);

        $svg = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{$width}\" height=\"{$height}\" viewBox=\"0 0 {$width} {$height}\">\n" .
            "  <image href=\"data:image/png;base64,{$imgB64}\" width=\"{$width}\" height=\"{$height}\" />\n" .
            "</svg>\n";

        file_put_contents($svgPath, $svg);
    }

    public function convertPngToSvg(string $pngPath, string $svgPath): void
    {
        if ($this->convertPngToSvgWithPotrace($pngPath, $svgPath)) {
            return;
        }

        $this->createSvgWithEmbeddedImage($pngPath, $svgPath);
    }

    public function convertPngToSvgWithPotrace(string $pngPath, string $svgPath): bool
    {
        $pbmPath = preg_replace('/\.png$/i', '.pbm', $pngPath);
        if (!$pbmPath) {
            return false;
        }

        $cmdPbm = [
            $this->magickBinary(),
            $pngPath,
            '-colorspace', 'Gray',
            '-threshold', '50%',
            $pbmPath,
        ];

        $this->runProcess($cmdPbm, 'PBM conversion failed');

        $cmdPotrace = [
            'potrace',
            $pbmPath,
            '-s',
            '-o', $svgPath,
            '--tight',
            '--opttolerance', '0.2',
            '--alphamax', '1.0',
        ];

        $ok = $this->runProcess($cmdPotrace, 'Potrace failed', false);
        if (is_file($pbmPath)) {
            @unlink($pbmPath);
        }

        return $ok && is_file($svgPath);
    }

    public function pngBytesToSvgBase64(string $pngBytes, int $width, int $height): string
    {
        $pngB64 = base64_encode($pngBytes);
        $svg = "<?xml version='1.0' encoding='UTF-8'?>\n" .
            "<svg xmlns='http://www.w3.org/2000/svg' width='{$width}' height='{$height}' viewBox='0 0 {$width} {$height}'>\n" .
            "  <image href='data:image/png;base64,{$pngB64}' width='{$width}' height='{$height}' />\n" .
            "</svg>\n";

        return base64_encode($svg);
    }

    public function getBlackPixelPercentage(string $path): float
    {
        $cmd = [
            $this->magickBinary(),
            $path,
            '-alpha', 'off',
            '-colorspace', 'Gray',
            '-format', '%[fx:mean]',
            'info:',
        ];

        $output = $this->runProcessWithOutput($cmd, 'Image stats failed');
        $mean = is_numeric($output) ? (float) $output : 0.0;
        $mean = max(0.0, min(1.0, $mean));

        return (1.0 - $mean) * 100.0;
    }

    private function convertSvgBytesToPng(string $fileBytes, string $targetPath, int $maxLongSide): void
    {
        $tmpSvg = tempnam(sys_get_temp_dir(), 'svg_');
        if ($tmpSvg === false) {
            throw new \RuntimeException('Failed to create temp SVG file.');
        }

        file_put_contents($tmpSvg, $fileBytes);

        $cmd = [
            $this->rsvgBinary(),
            $tmpSvg,
            '-o', $targetPath,
        ];

        $ok = $this->runProcess($cmd, 'SVG rasterization failed', false);
        if (!$ok) {
            $cmdFallback = [
                $this->magickBinary(),
                $tmpSvg,
                $targetPath,
            ];
            $this->runProcess($cmdFallback, 'SVG rasterization failed');
        }

        @unlink($tmpSvg);

        $this->resizeAndFlattenPng($targetPath, $maxLongSide);
    }

    private function writeBytesToPath(string $bytes, string $targetPath): void
    {
        $dir = dirname($targetPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        if (file_put_contents($targetPath, $bytes) === false) {
            throw new \RuntimeException('Failed to write uploaded file.');
        }
        
        // Ensure file is readable by web server
        chmod($targetPath, 0644);
    }

    private function magickBinary(): string
    {
        return config('services.image_tools.magick', 'magick');
    }

    private function rsvgBinary(): string
    {
        return config('services.image_tools.rsvg', 'rsvg-convert');
    }

    private function runProcess(array $command, string $errorMessage, bool $throwOnFailure = true): bool
    {
        $process = new Process($command);
        $process->run();

        if (!$process->isSuccessful()) {
            if ($throwOnFailure) {
                throw new \RuntimeException($errorMessage . ': ' . $process->getErrorOutput());
            }

            return false;
        }

        return true;
    }

    private function runProcessWithOutput(array $command, string $errorMessage): string
    {
        $process = new Process($command);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException($errorMessage . ': ' . $process->getErrorOutput());
        }

        return trim($process->getOutput());
    }
}
