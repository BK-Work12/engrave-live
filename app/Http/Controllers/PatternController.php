<?php

namespace App\Http\Controllers;

use App\Services\ImageValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Pattern;
use Inertia\Inertia;

class PatternController extends Controller
{
    protected $imageValidator;

    public function __construct(ImageValidator $imageValidator)
    {
        $this->imageValidator = $imageValidator;
    }

    /**
     * Show the pattern upload page
     */
    public function index()
    {
        return Inertia::render('PatternUpload');
    }

    /**
     * List all patterns (with optional filters)
     */
    public function list(Request $request)
    {
        $query = Pattern::query();

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by public/marketplace
        if ($request->boolean('public_only')) {
            $query->where('is_public', true);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search);
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'recent');
        switch ($sortBy) {
            case 'popular':
                $query->orderBy('downloads', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            default: // recent
                $query->orderBy('created_at', 'desc');
        }

        $patterns = $query->paginate(20);

        return response()->json([
            'success' => true,
            'patterns' => $patterns->items(),
            'pagination' => [
                'current_page' => $patterns->currentPage(),
                'total' => $patterns->total(),
                'per_page' => $patterns->perPage(),
            ]
        ]);
    }

    /**
     * Validate pattern image
     */
    public function validatePattern(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240', // 10MB
        ]);

        $file = $request->file('file');
        $validation = $this->imageValidator->validatePatternImage($file);

        return response()->json([
            'success' => true,
            'validation' => $validation,
            'message' => $this->imageValidator->generateErrorMessage($validation)
        ]);
    }

    /**
     * Validate outline image
     */
    public function validateOutline(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
        ]);

        $file = $request->file('file');
        $validation = $this->imageValidator->validateOutlineImage($file);

        return response()->json([
            'success' => true,
            'validation' => $validation,
            'message' => $this->imageValidator->generateErrorMessage($validation)
        ]);
    }

    /**
     * Auto-detect image type
     */
    public function autoDetect(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
        ]);

        $file = $request->file('file');
        $detectedType = $this->imageValidator->autoDetectImageType($file);
        
        $validation = null;
        if ($detectedType === 'pattern') {
            $validation = $this->imageValidator->validatePatternImage($file);
        } elseif ($detectedType === 'outline') {
            $validation = $this->imageValidator->validateOutlineImage($file);
        }

        return response()->json([
            'success' => true,
            'detected_type' => $detectedType,
            'confidence' => $detectedType === 'unknown' ? 'medium' : 'high',
            'validation' => $validation,
            'message' => "Image detected as: {$detectedType}"
        ]);
    }

    /**
     * Upload pattern
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'category' => 'required|in:scrollwork,leatherwork,other',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tags' => 'nullable|string',
            'is_public' => 'boolean',
            'price' => 'nullable|numeric|min:0',
            'validate_image' => 'boolean',
        ]);

        $file = $request->file('file');
        
        // Validate image if requested
        if ($request->boolean('validate_image', true)) {
            $validation = $this->imageValidator->validatePatternImage($file);
            
            if (!$validation['is_valid']) {
                return response()->json([
                    'success' => false,
                    'error' => $this->imageValidator->generateErrorMessage($validation),
                    'validation_errors' => $validation['errors'],
                    'validation_warnings' => $validation['warnings'] ?? [],
                    'validation_metadata' => $validation['metadata'] ?? []
                ], 400);
            }
        }

        // Store the file
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('patterns/' . $request->category, $filename, 'public');

        // Generate thumbnail
        $thumbnailPath = $this->generateThumbnail($file, $request->category, $filename);

        // Parse tags
        $tags = [];
        if ($request->has('tags')) {
            $tags = array_filter(array_map('trim', explode(',', $request->tags)));
        }

        // Create pattern record
        $pattern = Pattern::create([
            'user_id' => auth()->id() ?? null,
            'name' => $request->name,
            'category' => $request->category,
            'description' => $request->description,
            'tags' => $tags,
            'file_path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'is_public' => $request->boolean('is_public', false),
            'price' => $request->input('price', 0),
            'downloads' => 0,
            'rating' => 0,
            'rating_count' => 0,
        ]);

        $responseData = [
            'success' => true,
            'pattern' => $pattern,
            'message' => 'Pattern uploaded successfully'
        ];

        // Add warnings if any
        if (isset($validation['warnings']) && !empty($validation['warnings'])) {
            $responseData['warnings'] = $validation['warnings'];
            $responseData['message'] = 'Pattern uploaded successfully with warnings. Please review.';
        }

        return response()->json($responseData);
    }

    /**
     * Get pattern by ID
     */
    public function show($id)
    {
        $pattern = Pattern::findOrFail($id);

        return response()->json([
            'success' => true,
            'pattern' => $pattern
        ]);
    }

    /**
     * Update pattern
     */
    public function update(Request $request, $id)
    {
        $pattern = Pattern::findOrFail($id);

        // Check authorization
        if ($pattern->user_id && $pattern->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'tags' => 'nullable|string',
            'is_public' => 'boolean',
            'price' => 'nullable|numeric|min:0',
        ]);

        $data = $request->only(['name', 'description', 'is_public', 'price']);

        if ($request->has('tags')) {
            $data['tags'] = array_filter(array_map('trim', explode(',', $request->tags)));
        }

        $pattern->update($data);

        return response()->json([
            'success' => true,
            'pattern' => $pattern,
            'message' => 'Pattern updated successfully'
        ]);
    }

    /**
     * Delete pattern
     */
    public function destroy($id)
    {
        $pattern = Pattern::findOrFail($id);

        // Check authorization
        if ($pattern->user_id && $pattern->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 403);
        }

        // Delete files
        Storage::disk('public')->delete($pattern->file_path);
        if ($pattern->thumbnail_path) {
            Storage::disk('public')->delete($pattern->thumbnail_path);
        }

        $pattern->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pattern deleted successfully'
        ]);
    }

    /**
     * Record pattern download
     */
    public function download($id)
    {
        $pattern = Pattern::findOrFail($id);
        $pattern->increment('downloads');

        return response()->json([
            'success' => true,
            'message' => 'Download recorded'
        ]);
    }

    /**
     * Rate pattern
     */
    public function rate(Request $request, $id)
    {
        $request->validate([
            'rating' => 'required|numeric|min:1|max:5'
        ]);

        $pattern = Pattern::findOrFail($id);

        // Calculate new average
        $newRating = (($pattern->rating * $pattern->rating_count) + $request->rating) 
                    / ($pattern->rating_count + 1);

        $pattern->update([
            'rating' => $newRating,
            'rating_count' => $pattern->rating_count + 1
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rating submitted successfully',
            'pattern' => $pattern
        ]);
    }

    /**
     * Get user statistics
     */
    public function userStats($userId)
    {
        $patterns = Pattern::where('user_id', $userId)->get();

        $stats = [
            'user_id' => $userId,
            'total_patterns' => $patterns->count(),
            'total_downloads' => $patterns->sum('downloads'),
            'total_revenue' => $patterns->sum(function($p) {
                return $p->downloads * $p->price;
            }),
            'average_rating' => $patterns->avg('rating'),
            'patterns' => $patterns
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Generate thumbnail for uploaded image
     */
    protected function generateThumbnail($file, $category, $filename)
    {
        try {
            $image = imagecreatefromstring(file_get_contents($file->getRealPath()));
            
            if (!$image) {
                return null;
            }

            $width = imagesx($image);
            $height = imagesy($image);

            // Calculate thumbnail size (max 200x200)
            $maxSize = 200;
            if ($width > $height) {
                $newWidth = $maxSize;
                $newHeight = ($height / $width) * $maxSize;
            } else {
                $newHeight = $maxSize;
                $newWidth = ($width / $height) * $maxSize;
            }

            $thumb = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($thumb, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            $thumbFilename = 'thumb_' . pathinfo($filename, PATHINFO_FILENAME) . '.png';
            $thumbPath = storage_path('app/public/patterns/' . $category . '/' . $thumbFilename);
            
            imagepng($thumb, $thumbPath);

            imagedestroy($image);
            imagedestroy($thumb);

            return 'patterns/' . $category . '/' . $thumbFilename;
        } catch (\Exception $e) {
            \Log::error('Thumbnail generation failed: ' . $e->getMessage());
            return null;
        }
    }
}
