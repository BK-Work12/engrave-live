<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GeneratorController extends Controller
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
                'outline' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
                'design' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
                'border_offset' => 'nullable|numeric|min:0|max:5',
            ]);

            $uploadsPath = $this->images->ensureUploadsDirectory();

            $outlineFile = $request->file('outline');
            $designFile = $request->file('design');
            $borderOffset = (float) $request->input('border_offset', 0);

            $outlinePath = $uploadsPath . DIRECTORY_SEPARATOR . 'outline.png';
            $designPath = $uploadsPath . DIRECTORY_SEPARATOR . 'design.png';

            $this->images->processAndSaveImage($outlineFile->get(), $outlineFile->getClientOriginalName(), $outlinePath);
            $this->images->processAndSaveImage($designFile->get(), $designFile->getClientOriginalName(), $designPath);

            if ($borderOffset > 0) {
                $this->images->applyBorderOffset($outlinePath, $borderOffset);
            }

            $outlineDensity = $this->getBlackPixelPercentage($outlinePath);
            if ($outlineDensity > 80.0) {
                // Auto-correct inverted/too-dark outlines
                $this->images->invertColors($outlinePath);
                $outlineDensity = $this->getBlackPixelPercentage($outlinePath);
            }
            $designDensity = $this->getBlackPixelPercentage($designPath);

            if ($outlineDensity > 20.0) {
                return response()->json([
                    'success' => false,
                    'error' => sprintf('The Outline Image (Density: %.2f%%) appears to be a complex design instead of an empty vector.', $outlineDensity),
                ], 400);
            }

            if ($designDensity < 5.0) {
                return response()->json([
                    'success' => false,
                    'error' => sprintf('The Design Image (Density: %.2f%%) appears to be empty or too light to use as a pattern.', $designDensity),
                ], 400);
            }

            $prompt = $this->basePrompt();
            $promptSuffix = (string) $request->attributes->get('custom_prompt_suffix', '');
            if ($promptSuffix !== '') {
                $prompt .= "\n" . $promptSuffix;
            }

            $response = $this->gemini->generateImage([
                ['text' => $prompt],
                ['text' => 'Design pattern to use for filling:'],
                ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($designPath)]],
                ['text' => 'Outline shape to fill with the pattern:'],
                ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($outlinePath)]],
            ], [
                'responseModalities' => ['IMAGE'],
                'temperature' => 0.4,
            ]);

            $imageBase64 = $this->gemini->extractInlineImageBase64($response);
            if (!$imageBase64) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to extract image from AI response',
                ], 500);
            }

            $filename = 'img_' . time() . '.png';
            $svgFilename = str_replace('.png', '.svg', $filename);

            $outputPath = $uploadsPath . DIRECTORY_SEPARATOR . $filename;
            file_put_contents($outputPath, base64_decode($imageBase64));
            $this->images->postProcessFill($outputPath);

            $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
            $this->images->convertPngToSvg($outputPath, $svgPath);

            return response()->json([
                'success' => true,
                'filename' => $filename,
                'image_url' => Storage::disk('public')->url('uploads/' . $filename),
                'svg_url' => Storage::disk('public')->url('uploads/' . $svgFilename),
            ]);
        } catch (\RuntimeException $e) {
            $errorMsg = $e->getMessage();
            
            // Check if it's a missing CLI tool error
            if (strpos($errorMsg, 'magick') !== false || strpos($errorMsg, 'not found') !== false) {
                return response()->json([
                    'success' => false,
                    'error' => 'Image processing tools (ImageMagick) are not installed. See INSTALL_IMAGE_TOOLS.md for setup instructions.',
                    'detail' => $errorMsg,
                ], 500);
            }
            
            if (strpos($errorMsg, 'rsvg') !== false) {
                return response()->json([
                    'success' => false,
                    'error' => 'SVG conversion tool (rsvg-convert) is not installed. See INSTALL_IMAGE_TOOLS.md for setup instructions.',
                    'detail' => $errorMsg,
                ], 500);
            }
            
            return response()->json([
                'success' => false,
                'error' => 'Image processing error: ' . $errorMsg,
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Generation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function generateWithOptions(Request $request)
    {
        $request->validate([
            'outline' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'design' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'pattern_intricacy' => 'nullable|in:low,standard,high',
            'pattern_symmetry' => 'nullable|in:none,horizontal,vertical,both',
            'offset_border' => 'nullable|string',
        ]);

        $intricacy = $request->input('pattern_intricacy', 'standard');
        $symmetry = $request->input('pattern_symmetry', 'none');
        $offsetBorder = $request->input('offset_border', 'disabled');

        $borderOffset = 0.0;
        if ($offsetBorder !== 'disabled') {
            $borderOffset = (float) str_replace('mm', '', $offsetBorder);
        }

        $request->merge(['border_offset' => $borderOffset]);

        $intricacyInstruction = match ($intricacy) {
            'low' => 'Use SIMPLER, more minimal scrollwork patterns with fewer decorative elements. Focus on clean, basic scroll designs.',
            'high' => 'Use HIGHLY INTRICATE, complex scrollwork patterns with maximum detail, fine lines, and elaborate decorative elements.',
            default => 'Use standard, well-balanced scrollwork patterns with moderate detail and decorative elements.',
        };

        $symmetryInstruction = match ($symmetry) {
            'horizontal' => 'Apply HORIZONTAL SYMMETRY: Mirror the design elements horizontally across a vertical center line.',
            'vertical' => 'Apply VERTICAL SYMMETRY: Mirror the design elements vertically across a horizontal center line.',
            'both' => 'Apply BOTH HORIZONTAL AND VERTICAL SYMMETRY: Create a perfectly symmetrical design that mirrors both directions.',
            default => 'No symmetry constraints - allow natural, organic flow of the pattern.',
        };

        $request->attributes->set('custom_prompt_suffix', "\nPATTERN CUSTOMIZATION:\n- PATTERN INTRICACY: {$intricacyInstruction}\n- PATTERN SYMMETRY: {$symmetryInstruction}\n");

        return $this->generate($request);
    }

    public function generateBackgroundFill(Request $request)
    {
        $request->validate([
            'outline' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'background_fill' => 'nullable|file|mimes:png,jpg,jpeg,svg|max:10240',
            'border_offset' => 'nullable|numeric|min:0|max:5',
        ]);

        $uploadsPath = $this->images->ensureUploadsDirectory();
        $outlineFile = $request->file('outline');
        $backgroundFile = $request->file('background_fill');
        $borderOffset = (float) $request->input('border_offset', 0);

        $outlinePath = $uploadsPath . DIRECTORY_SEPARATOR . 'outline.png';
        $this->images->processAndSaveImage($outlineFile->get(), $outlineFile->getClientOriginalName(), $outlinePath);

        if ($borderOffset > 0) {
            $this->images->applyBorderOffset($outlinePath, $borderOffset);
        }

        if (!$backgroundFile) {
            $filename = 'img_' . time() . '.png';
            $svgFilename = str_replace('.png', '.svg', $filename);
            $outputPath = $uploadsPath . DIRECTORY_SEPARATOR . $filename;
            copy($outlinePath, $outputPath);
            $this->images->postProcessFill($outputPath);

            $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
            $this->images->convertPngToSvg($outputPath, $svgPath);

            return response()->json([
                'success' => true,
                'filename' => $filename,
                'image_url' => Storage::disk('public')->url('uploads/' . $filename),
                'svg_url' => Storage::disk('public')->url('uploads/' . $svgFilename),
            ]);
        }

        $backgroundPath = $uploadsPath . DIRECTORY_SEPARATOR . 'background_fill.png';
        $this->images->processAndSaveImage($backgroundFile->get(), $backgroundFile->getClientOriginalName(), $backgroundPath);

        $prompt = "ACT AS A MASTER GUNSMITH AND HAND-ENGRAVER. Your goal is to FILL the OUTLINE shapes with the provided BACKGROUND FILL image.\n\n" .
            "CRITICAL COMPOSITION RULES:\n" .
            "1. ABSOLUTE MASKING: Anything outside the outline must remain pure white.\n" .
            "2. MULTIPLE/DISCONNECTED SHAPES: Fill each shape separately.\n" .
            "3. FILL APPLICATION: Apply the background fill to the interior of each shape.\n" .
            "4. NO DECORATIVE ELEMENTS beyond the background fill.\n\n" .
            "CONSTRAINTS:\n- ZERO OUTSIDE BLEED\n- HOLE INTEGRITY\n- PERFECT CLIPPING";

        $response = $this->gemini->generateImage([
            ['text' => $prompt],
            ['text' => 'Background fill image to use:'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($backgroundPath)]],
            ['text' => 'Outline shape to fill:'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($outlinePath)]],
        ], [
            'responseModalities' => ['IMAGE'],
            'temperature' => 0.4,
        ]);

        $imageBase64 = $this->gemini->extractInlineImageBase64($response);
        if (!$imageBase64) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate image',
            ], 500);
        }

        $filename = 'img_' . time() . '.png';
        $svgFilename = str_replace('.png', '.svg', $filename);
        $outputPath = $uploadsPath . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($outputPath, base64_decode($imageBase64));
        $this->images->postProcessFill($outputPath);

        $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
        $this->images->convertPngToSvg($outputPath, $svgPath);

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'image_url' => Storage::disk('public')->url('uploads/' . $filename),
            'svg_url' => Storage::disk('public')->url('uploads/' . $svgFilename),
        ]);
    }

    public function download(string $filename)
    {
        $path = Storage::disk('public')->path('uploads/' . $filename);

        if (!file_exists($path) && str_ends_with($filename, '.svg')) {
            $pngPath = preg_replace('/\.svg$/i', '.png', $path);
            if ($pngPath && file_exists($pngPath)) {
                $this->images->convertPngToSvg($pngPath, $path);
            }
        }

        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return response()->download($path, $filename, [
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function imageBase64(string $filename)
    {
        $path = Storage::disk('public')->path('uploads/' . $filename);
        if (!file_exists($path)) {
            return response()->json(['success' => false, 'error' => 'File not found'], 404);
        }

        $bytes = file_get_contents($path);
        $mime = str_ends_with($filename, '.svg') ? 'image/svg+xml' : 'image/png';
        $b64 = base64_encode($bytes);

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'base64' => $b64,
            'dataUrl' => "data:{$mime};base64,{$b64}",
        ]);
    }

    private function loadBase64(string $path): string
    {
        $bytes = file_get_contents($path);
        if ($bytes === false) {
            throw new \RuntimeException('Failed to read image for base64 encoding.');
        }

        return base64_encode($bytes);
    }

    private function getBlackPixelPercentage(string $path): float
    {
        if (!function_exists('imagecreatefromstring')) {
            return $this->images->getBlackPixelPercentage($path);
        }

        $image = imagecreatefromstring(file_get_contents($path));
        if (!$image) {
            return 0.0;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $blackCount = 0;
        $total = 0;

        for ($y = 0; $y < $height; $y += 5) {
            for ($x = 0; $x < $width; $x += 5) {
                $rgb = imagecolorat($image, $x, $y);
                $alpha = ($rgb >> 24) & 0x7F;
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                // GD alpha: 0 = opaque, 127 = fully transparent
                if ($alpha < 127 && $r < 128 && $g < 128 && $b < 128) {
                    $blackCount++;
                }
                $total++;
            }
        }

        imagedestroy($image);

        return $total > 0 ? ($blackCount / $total) * 100 : 0.0;
    }

    private function basePrompt(): string
    {
        return "ACT AS A MASTER GUNSMITH AND HAND-ENGRAVER. Your goal is to INTELLIGENTLY ADAPT and REPLICATE the DESIGN image to fill ONLY inside the OUTLINE shapes.\n\n" .
            "CRITICAL COMPOSITION RULES:\n" .
            "1. ABSOLUTE MASKING: The outline defines the only allowed engraving area; outside must be pure white.\n" .
            "2. MULTIPLE/DISCONNECTED SHAPES: Clone the full design into each separate shape.\n" .
            "3. DENSE INTERIOR FILL: The pattern must cover the ENTIRE interior with rich, continuous scrollwork.\n" .
            "4. NO FRAMES: Do NOT create a border-only frame or edge-only decoration.\n" .
            "5. STYLE TRANSFER: Use the DESIGN image as a texture fill and repeat/flow it to cover all open space.\n\n" .
            "STYLE & TECHNIQUE:\n" .
            "- Pure black and white line work only (#000000 and #FFFFFF).\n" .
            "- No gray gradients or shading.\n" .
            "- Keep linework crisp and high-contrast.\n\n" .
            "CONSTRAINTS:\n" .
            "- ZERO OUTSIDE BLEED\n" .
            "- HOLE INTEGRITY\n" .
            "- SILHOUETTE DEFINITION: No outer border line.\n" .
            "- FILL CONSISTENCY: Avoid large empty regions anywhere inside the outline.\n\n" .
            "GOAL:\n" .
            "Create a perfectly clipped engraving blueprint with dense interior coverage and zero content outside boundaries.";
    }
}
