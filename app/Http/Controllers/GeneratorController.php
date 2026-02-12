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
                    'error' => sprintf('❌ OUTLINE IMAGE ERROR (Density: %.2f%%): The outline appears to be a complex pattern/design instead of an empty vector/silhouette. Per EngraveFill Pro guidelines, outline images should be simple, closed black silhouettes on white backgrounds. Complex multi-part shapes should be separated and uploaded individually.', $outlineDensity),
                ], 400);
            }

            if ($designDensity < 5.0) {
                return response()->json([
                    'success' => false,
                    'error' => sprintf('❌ PATTERN IMAGE ERROR (Density: %.2f%%): The design image appears to be empty or too light. Pattern images need detailed, intricate designs (detailed scrollwork, decorative elements, etc.). Ensure your pattern has sufficient detail and contrast.', $designDensity),
                ], 400);
            }

            $prompt = $this->basePrompt();
            $promptSuffix = (string) $request->attributes->get('custom_prompt_suffix', '');
            if ($promptSuffix !== '') {
                $prompt .= "\n" . $promptSuffix;
            }

            $response = $this->gemini->generateImage([
                ['text' => $prompt],
                ['text' => 'DESIGN PATTERN (to replicate inside outlines):'],
                ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($designPath)]],
                ['text' => 'OUTLINE BOUNDARIES (black lines show where to fill - fill INSIDE the black outlines ONLY):'],
                ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($outlinePath)]],
                ['text' => 'Generate the result with pattern ONLY inside the outlined areas. Keep everything outside pure white.'],
            ], [
                'responseModalities' => ['IMAGE'],
                'temperature' => 0.3,
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
            chmod($outputPath, 0644); // Ensure file is readable
            $this->images->postProcessFill($outputPath);

            $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
            $this->images->convertPngToSvg($outputPath, $svgPath);
            if (file_exists($svgPath)) {
                chmod($svgPath, 0644); // Ensure SVG is readable
            }

            return response()->json([
                'success' => true,
                'filename' => $filename,
                'image_url' => url('uploads/' . $filename),
                'svg_url' => url('uploads/' . $svgFilename),
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
            chmod($outputPath, 0644); // Ensure file is readable
            $this->images->postProcessFill($outputPath);

            $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
            $this->images->convertPngToSvg($outputPath, $svgPath);
            if (file_exists($svgPath)) {
                chmod($svgPath, 0644); // Ensure SVG is readable
            }

            return response()->json([
                'success' => true,
                'filename' => $filename,
                'image_url' => url('uploads/' . $filename),
                'svg_url' => url('uploads/' . $svgFilename),
            ]);
        }

        $backgroundPath = $uploadsPath . DIRECTORY_SEPARATOR . 'background_fill.png';
        $this->images->processAndSaveImage($backgroundFile->get(), $backgroundFile->getClientOriginalName(), $backgroundPath);

        $prompt = "ACT AS A MASTER GUNSMITH AND HAND-ENGRAVER creating precise fill patterns.\n\n" .
            "TASK: Fill the INTERIOR areas enclosed by the black outline with the provided background fill pattern.\n\n" .
            "CRITICAL MASKING RULES:\n" .
            "1. STRICT CONTAINMENT: Fill ONLY the white interior areas INSIDE the black outline boundaries.\n" .
            "2. PURE WHITE OUTSIDE: Everything outside the outlined shapes MUST remain completely white (#FFFFFF).\n" .
            "3. PERFECT CLIPPING: Use the outline as a strict clipping mask.\n" .
            "4. MULTIPLE SHAPES: Fill each separate enclosed shape independently.\n\n" .
            "CONSTRAINTS:\n" .
            "✓ ZERO bleed outside boundaries\n" .
            "✓ Keep all exterior areas pure white\n" .
            "✓ Fill interiors completely\n" .
            "✓ Maintain clean edges\n\n" .
            "The outline shows BOUNDARIES (black lines). Fill INSIDE only. Keep OUTSIDE white.";

        $response = $this->gemini->generateImage([
            ['text' => $prompt],
            ['text' => 'BACKGROUND FILL PATTERN (to apply inside outlines):'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($backgroundPath)]],
            ['text' => 'OUTLINE BOUNDARIES (black lines - fill INSIDE only):'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($outlinePath)]],
            ['text' => 'Generate result with fill ONLY inside outlined areas. Keep everything outside pure white.'],
        ], [
            'responseModalities' => ['IMAGE'],
            'temperature' => 0.3,
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
        chmod($outputPath, 0644); // Ensure file is readable
        $this->images->postProcessFill($outputPath);

        $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
        $this->images->convertPngToSvg($outputPath, $svgPath);
        if (file_exists($svgPath)) {
            chmod($svgPath, 0644); // Ensure SVG is readable
        }

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'image_url' => url('uploads/' . $filename),
            'svg_url' => url('uploads/' . $svgFilename),
        ]);
    }

    public function download(string $filename)
    {
        $path = public_path('uploads/' . $filename);

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
        $path = public_path('uploads/' . $filename);
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
        return "ACT AS A MASTER GUNSMITH AND HAND-ENGRAVER creating precise ornamental fill patterns per EngraveFill Pro specifications.\n\n" .
            "TASK: Fill the INTERIOR areas enclosed by the black outline with the provided design pattern.\n\n" .
            "CRITICAL MASKING RULES (EngraveFill Pro v1.1 - Seamless Patterns):\n" .
            "1. STRICT CONTAINMENT: The black outline lines define boundaries. Fill ONLY the white interior areas INSIDE these black boundaries.\n" .
            "2. PURE WHITE OUTSIDE: Everything outside the outlined shapes MUST remain completely white (#FFFFFF). ZERO content beyond boundaries.\n" .
            "3. PERFECT CLIPPING: Use the outline as a strict clipping mask. The scrollwork pattern should ONLY appear within enclosed areas.\n" .
            "4. RESPECT HOLES & CUTOUTS: If there are hollow areas, cutouts, or internal holes within shapes, keep them empty (white).\n" .
            "5. MULTIPLE SHAPES: Fill each separate enclosed shape independently with the pattern. Shapes may have internal white spaces which should remain white.\n" .
            "6. SEAMLESS TILING: Apply the design pattern seamlessly with no visible seams or breaks as it repeats across the interior.\n\n" .
            "PATTERN APPLICATION REQUIREMENTS:\n" .
            "- The white interior space (within black boundaries) should be completely filled with the provided pattern\n" .
            "- Adapt the pattern to cover all white interior space uniformly\n" .
            "- Pattern flow should be organic and natural, conforming to the shape's interior\n" .
            "- Tile seamlessly with no visible repetition artifacts\n" .
            "- Completely fill all available interior area (not just borders)\n\n" .
            "STYLE REQUIREMENTS:\n" .
            "- Pure black and white linework only (#000000 and #FFFFFF)\n" .
            "- No gray gradients, anti-aliasing, or soft edges\n" .
            "- Crisp, high-contrast ornamental engraving lines\n" .
            "- Do NOT add extra border lines beyond the provided outline\n" .
            "- Do NOT thicken or alter the outline itself\n\n" .
            "ABSOLUTE CONSTRAINTS (Non-negotiable):\n" .
            "✓ ZERO bleed outside outlined boundaries - pattern must not extend beyond black lines\n" .
            "✓ Keep ALL exterior areas pure white (#FFFFFF)\n" .
            "✓ Fill interiors completely and densely with pattern\n" .
            "✓ Maintain crisp, clean edges at all boundaries\n" .
            "✓ Respect all cutouts and internal white spaces\n\n" .
            "Remember: The outline shows BOUNDARIES (black lines). Everything INSIDE these boundaries should be filled with the design pattern. Everything OUTSIDE must stay pure white. Internal holes/cutouts stay white.";
    }
}
