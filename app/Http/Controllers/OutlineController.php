<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;

class OutlineController extends Controller
{
    public function __construct(
        private GeminiService $gemini,
        private ImageProcessingService $images
    ) {
    }

    public function generate(Request $request)
    {
        try {
            $request->validate([
                'image_base64' => 'required|string',
                'detail_level' => 'nullable|in:low,medium,high',
                'thickness' => 'nullable|numeric|min:0.5|max:10',
                'resolution' => 'nullable|in:standard,high,ultra',
                'output_format' => 'nullable|in:png,svg',
            ]);

            $detailLevel = $request->input('detail_level', 'medium');
            $resolution = $request->input('resolution', 'standard');
            $outputFormat = $request->input('output_format', 'png');

            $prompt = "Analyze the image and create a precise, high-contrast, pure black-and-white line art representation. " .
                "CRITICAL INSTRUCTIONS: " .
                "1. IGNORE all shading, gradients, shadows, and texture fills. " .
                "2. If the image uses a dark background with light details (negative space), INVERT the logic. " .
                "3. Intelligibly trace the edges of the primary shapes and scrollwork. " .
                "4. Output MUST be a clean line drawing on a solid pure-white background. No gray tones allowed.";

            if ($detailLevel === 'low') {
                $prompt .= ' Use minimal lines, focusing only on the main silhouette and major features.';
            } elseif ($detailLevel === 'high') {
                $prompt .= ' Capture intricate details and textures with precise lines, but strictly as outlines.';
            } else {
                $prompt .= ' Maintain a balance of main features and important details.';
            }

            $response = $this->gemini->generateImage([
                ['inlineData' => ['mimeType' => 'image/jpeg', 'data' => $request->input('image_base64')]],
                ['text' => $prompt],
            ]);

            $outlineBase64 = $this->gemini->extractInlineImageBase64($response);
            if (!$outlineBase64) {
                return response()->json(['error' => 'No image data in response.'], 500);
            }

            $scaleFactor = match ($resolution) {
                'high' => 2,
                'ultra' => 4,
                default => 1,
            };

            $pngBytes = base64_decode($outlineBase64);
            if ($scaleFactor > 1) {
                $pngBytes = $this->scalePngBytes($pngBytes, $scaleFactor);
            }

            $size = getimagesizefromstring($pngBytes);
            if (!$size) {
                return response()->json(['error' => 'Failed to read generated image size.'], 500);
            }

            [$width, $height] = $size;

            if ($outputFormat === 'svg') {
                $svgBase64 = $this->images->pngBytesToSvgBase64($pngBytes, $width, $height);
                return response()->json([
                    'outline_base64' => $svgBase64,
                    'format' => 'svg',
                ]);
            }

            return response()->json([
                'outline_base64' => base64_encode($pngBytes),
                'format' => 'png',
            ]);
        } catch (\RuntimeException $e) {
            $errorMsg = $e->getMessage();
            
            // Check if it's a missing CLI tool error
            if (strpos($errorMsg, 'magick') !== false || strpos($errorMsg, 'not found') !== false) {
                return response()->json([
                    'error' => 'Image processing tools (ImageMagick) are not installed. See INSTALL_IMAGE_TOOLS.md for setup instructions.',
                    'detail' => $errorMsg,
                ], 500);
            }
            
            return response()->json([
                'error' => 'Outline generation error: ' . $errorMsg,
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Outline generation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function scalePngBytes(string $pngBytes, int $scaleFactor): string
    {
        $tmpInput = tempnam(sys_get_temp_dir(), 'outline_');
        $tmpOutput = tempnam(sys_get_temp_dir(), 'outline_out_');
        if ($tmpInput === false || $tmpOutput === false) {
            throw new \RuntimeException('Failed to create temp files for scaling.');
        }

        file_put_contents($tmpInput, $pngBytes);

        $cmd = [
            config('services.image_tools.magick', 'magick'),
            $tmpInput,
            '-resize', ($scaleFactor * 100) . '%',
            $tmpOutput,
        ];

        $process = new \Symfony\Component\Process\Process($cmd);
        $process->run();

        if (!$process->isSuccessful()) {
            @unlink($tmpInput);
            @unlink($tmpOutput);
            throw new \RuntimeException('Image scaling failed: ' . $process->getErrorOutput());
        }

        $scaledBytes = file_get_contents($tmpOutput);
        @unlink($tmpInput);
        @unlink($tmpOutput);

        return $scaledBytes ?: $pngBytes;
    }
}
