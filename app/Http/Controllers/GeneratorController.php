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

            // Relaxed validation - simply check that images aren't completely empty
            if ($outlineDensity < 1.0) {
                return response()->json([
                    'success' => false,
                    'error' => '❌ OUTLINE IMAGE ERROR: The outline image appears to be completely empty (white). Please provide an outline with visible shapes.',
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

        // Use stride of 2 instead of 5 to detect thin lines better
        for ($y = 0; $y < $height; $y += 2) {
            for ($x = 0; $x < $width; $x += 2) {
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
        return "SYSTEM ROLE:
You are a precise bitmap compositor creating laser-engraving artwork. Your output must be pixel-perfect and fabrication-ready.

INPUT:
• Outline Image: Contains BLACK outline shapes on WHITE background. These are HARD CLIPPING MASKS.
• Pattern Image: Contains the decorative scrollwork pattern to tile inside the selected shape.

CRITICAL CLIPPING MECHANISM:
The black outline acts as a BINARY MASK:
- INSIDE the black outline: Fill with the pattern
- OUTSIDE the black outline: Must be pure white (#FFFFFF, RGB 255,255,255)
- ON the black outline: Keep the original black line unchanged

SHAPE SELECTION:
1. Identify all separate enclosed shapes in the Outline Image
2. Fill EVERY enclosed shape completely with the pattern
3. Do not leave any shapes empty

PATTERN FILLING PROCESS:
1. Take the scrollwork pattern and tile/repeat it to completely fill the interior
2. Use the black outline as a cookie-cutter mask
3. Keep only the pattern pixels that fall within the outline boundary
4. Delete all pattern pixels outside the boundary
5. Result: Pattern visible ONLY inside, white background OUTSIDE

ABSOLUTE PIXEL RULES (NON-NEGOTIABLE):
✓ Every pixel inside outline boundary = pattern color from the design image
✓ Every pixel outside outline boundary = pure white (#FFFFFF)
✓ Outline pixels = original black color, unchanged
✓ NO gray pixels, NO soft edges, NO blending, NO semi-transparency
✓ NO pattern spillage beyond the outline boundary
✓ Crisp, sharp edges at the boundary
✓ Complete fill with zero gaps inside the selected shape

PATTERN QUALITY:
• Scale the pattern to fill the entire interior
• Preserve scrollwork detail and structure
• Align pattern flow naturally with the shape's curves
• Completely fill all enclosed areas within the boundary
• No white gaps inside the selected shape

ANTI-REQUIREMENTS (GUARANTEED FAILURES):
✗ Pattern extending outside the outline boundary
✗ Gray or soft-edged pixels
✗ Texture/pattern on the background
✗ Gaps in the fill within shapes
✗ Blurred or anti-aliased edges

FINAL CHECKLIST BEFORE OUTPUT:
□ All enclosed shapes are filled with the pattern
□ All pattern is 100% inside the outlines
□ All background is pure white
□ No pattern spillage anywhere
□ Outline edges are sharp and black
□ Image is laser-ready

OUTPUT:
Generate the result on a white canvas with black outlines preserved and pattern completely filling all enclosed shapes.";
    }
}
