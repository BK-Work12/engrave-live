<?php

namespace App\Http\Controllers;

use App\Models\Pattern;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use App\Services\SvgToolService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SvgToolController extends Controller
{
    public function __construct(
        private SvgToolService $svgTool,
        private ImageProcessingService $images,
        private GeminiService $gemini
    ) {
    }

    public function process(Request $request)
    {
        $request->validate([
            'svg_file' => 'required|file|mimes:svg,svg+xml|max:5120',
            'settings' => 'nullable|string',
        ]);

        $settings = $this->decodeSettings($request->input('settings', '{}'));
        $validated = $this->svgTool->validateSettings($settings);

        $svgContent = $request->file('svg_file')->get();
        $processed = $this->svgTool->processSvg($svgContent, $validated);

        return response($processed, 200, [
            'Content-Type' => 'image/svg+xml',
            'Content-Disposition' => 'attachment; filename="processed_' . $request->file('svg_file')->getClientOriginalName() . '"',
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'outline' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'pattern_id' => 'nullable|integer',
            'pattern_file' => 'nullable|file|mimes:png,jpg,jpeg,svg|max:10240',
            'pattern_type' => 'nullable|in:library,upload',
            'svg_settings' => 'nullable|string',
            'user_id' => 'nullable|integer',
        ]);

        $patternType = $request->input('pattern_type', 'library');
        $patternPath = null;

        $uploadsPath = $this->images->ensureUploadsDirectory();

        if ($patternType === 'library' && $request->filled('pattern_id')) {
            $pattern = Pattern::find($request->input('pattern_id'));
            if ($pattern) {
                $patternPath = Storage::disk('public')->path($pattern->file_path);
            }
        } elseif ($patternType === 'upload' && $request->hasFile('pattern_file')) {
            $patternFile = $request->file('pattern_file');
            $patternPath = $uploadsPath . DIRECTORY_SEPARATOR . 'design.png';
            $this->images->processAndSaveImage($patternFile->get(), $patternFile->getClientOriginalName(), $patternPath);
        }

        if (!$patternPath || !file_exists($patternPath)) {
            return response()->json(['success' => false, 'error' => 'No valid pattern provided'], 400);
        }

        $outlineFile = $request->file('outline');
        $outlinePath = $uploadsPath . DIRECTORY_SEPARATOR . 'outline.png';
        $this->images->processAndSaveImage($outlineFile->get(), $outlineFile->getClientOriginalName(), $outlinePath);

        $response = $this->gemini->generateImage([
            ['text' => $this->basePrompt()],
            ['text' => 'Design pattern to use for filling:'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($patternPath)]],
            ['text' => 'Outline shape to fill with the pattern:'],
            ['inlineData' => ['mimeType' => 'image/png', 'data' => $this->loadBase64($outlinePath)]],
        ], [
            'responseModalities' => ['IMAGE'],
            'temperature' => 0.4,
        ]);

        $imageBase64 = $this->gemini->extractInlineImageBase64($response);
        if (!$imageBase64) {
            return response()->json(['success' => false, 'error' => 'Failed to extract image from response'], 500);
        }

        $filename = 'img_' . time() . '.png';
        $svgFilename = str_replace('.png', '.svg', $filename);
        $outputPath = $uploadsPath . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($outputPath, base64_decode($imageBase64));
        $this->images->postProcessFill($outputPath);

        $svgPath = $uploadsPath . DIRECTORY_SEPARATOR . $svgFilename;
        $this->images->convertPngToSvg($outputPath, $svgPath);

        $settings = $this->decodeSettings($request->input('svg_settings', '{}'));
        $validated = $this->svgTool->validateSettings($settings);

        $svgContent = file_get_contents($svgPath);
        $processed = $this->svgTool->processSvg($svgContent, $validated);
        file_put_contents($svgPath, $processed);

        return response()->json([
            'success' => true,
            'png_url' => Storage::disk('public')->url('uploads/' . $filename),
            'svg_url' => Storage::disk('public')->url('uploads/' . $svgFilename),
            'svg_content' => $processed,
            'settings_applied' => $validated,
        ]);
    }

    public function defaultSettings()
    {
        return response()->json([
            'success' => true,
            'settings' => $this->svgTool->getDefaultSettings(),
        ]);
    }

    private function decodeSettings(string $settings): array
    {
        $decoded = json_decode($settings, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function basePrompt(): string
    {
        return "ACT AS A MASTER GUNSMITH AND HAND-ENGRAVER. Your goal is to INTELLIGENTLY ADAPT and REPLICATE the DESIGN image to fit ONLY inside the OUTLINE shapes.";
    }

    private function loadBase64(string $path): string
    {
        $bytes = file_get_contents($path);
        if ($bytes === false) {
            throw new \RuntimeException('Failed to read image for base64 encoding.');
        }

        return base64_encode($bytes);
    }
}
