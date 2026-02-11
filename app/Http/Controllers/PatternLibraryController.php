<?php

namespace App\Http\Controllers;

use App\Models\Pattern;
use App\Services\ImageValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PatternLibraryController extends Controller
{
    public function __construct(private ImageValidator $imageValidator)
    {
    }

    public function listLibraries(Request $request)
    {
        $userId = $request->input('user_id');
        $categories = ['scrollwork', 'leatherwork', 'other'];

        $libraries = [];
        foreach ($categories as $category) {
            $query = Pattern::query()->where('category', $category);
            if ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->whereNull('user_id')->orWhere('user_id', $userId);
                });
            }

            $count = $query->count();
            $libraries[] = [
                'id' => 'system_' . $category,
                'name' => ucfirst($category),
                'category' => $category,
                'type' => 'system',
                'pattern_count' => $count,
            ];
        }

        return response()->json(['success' => true, 'libraries' => $libraries]);
    }

    public function listCategory(string $category, Request $request)
    {
        $userId = $request->input('user_id');
        $query = Pattern::query()->where('category', $category);

        if ($userId) {
            $query->where(function ($q) use ($userId) {
                $q->whereNull('user_id')->orWhere('user_id', $userId);
            });
        }

        $patterns = $query->get();

        return response()->json([
            'success' => true,
            'category' => $category,
            'patterns' => $patterns,
            'count' => $patterns->count(),
        ]);
    }

    public function show(int $patternId)
    {
        $pattern = Pattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        return response()->json(['success' => true, 'pattern' => $pattern]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240',
            'category' => 'required|in:scrollwork,leatherwork,other',
            'name' => 'nullable|string|max:255',
            'user_id' => 'nullable|integer',
            'is_public' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'tags' => 'nullable|string',
            'validate_image' => 'nullable|boolean',
        ]);

        $file = $request->file('file');
        $validate = $request->boolean('validate_image', true);

        if ($validate) {
            $validation = $this->imageValidator->validatePatternImage($file);
            if (!$validation['is_valid']) {
                return response()->json([
                    'success' => false,
                    'error' => $this->imageValidator->generateErrorMessage($validation),
                    'validation_errors' => $validation['errors'],
                    'validation_warnings' => $validation['warnings'] ?? [],
                    'validation_metadata' => $validation['metadata'] ?? [],
                ], 400);
            }
        }

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('patterns/' . $request->category, $filename, 'public');

        $tags = [];
        if ($request->filled('tags')) {
            $tags = array_filter(array_map('trim', explode(',', $request->input('tags'))));
        }

        $pattern = Pattern::create([
            'user_id' => $request->input('user_id'),
            'name' => $request->input('name') ?: $file->getClientOriginalName(),
            'category' => $request->input('category'),
            'description' => $request->input('description'),
            'tags' => $tags,
            'file_path' => $path,
            'thumbnail_path' => null,
            'is_public' => $request->boolean('is_public', false),
            'price' => $request->input('price', 0),
            'downloads' => 0,
            'rating' => 0,
            'rating_count' => 0,
        ]);

        return response()->json([
            'success' => true,
            'pattern' => $pattern,
            'message' => 'Pattern uploaded successfully',
        ]);
    }

    public function delete(int $patternId, Request $request)
    {
        $pattern = Pattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        $userId = $request->input('user_id');
        if ($pattern->user_id && $userId && (int) $pattern->user_id !== (int) $userId) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        Storage::disk('public')->delete($pattern->file_path);
        if ($pattern->thumbnail_path) {
            Storage::disk('public')->delete($pattern->thumbnail_path);
        }

        $pattern->delete();

        return response()->json(['success' => true, 'message' => 'Pattern deleted successfully']);
    }

    public function userPatterns(Request $request)
    {
        $userId = $request->input('user_id');
        if (!$userId) {
            return response()->json(['success' => false, 'error' => 'user_id is required'], 400);
        }

        $patterns = Pattern::where('user_id', $userId)->get();

        return response()->json([
            'success' => true,
            'user_id' => $userId,
            'patterns' => $patterns,
            'count' => $patterns->count(),
        ]);
    }

    public function validatePattern(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240']);
        $validation = $this->imageValidator->validatePatternImage($request->file('file'));

        return response()->json([
            'success' => true,
            'validation' => $validation,
            'message' => $this->imageValidator->generateErrorMessage($validation),
        ]);
    }

    public function validateOutline(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240']);
        $validation = $this->imageValidator->validateOutlineImage($request->file('file'));

        return response()->json([
            'success' => true,
            'validation' => $validation,
            'message' => $this->imageValidator->generateErrorMessage($validation),
        ]);
    }

    public function autoDetect(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:png,jpg,jpeg,svg|max:10240']);
        $detected = $this->imageValidator->autoDetectImageType($request->file('file'));

        $validation = null;
        if ($detected === 'pattern') {
            $validation = $this->imageValidator->validatePatternImage($request->file('file'));
        } elseif ($detected === 'outline') {
            $validation = $this->imageValidator->validateOutlineImage($request->file('file'));
        }

        return response()->json([
            'success' => true,
            'detected_type' => $detected,
            'confidence' => $detected === 'unknown' ? 'medium' : 'high',
            'validation' => $validation,
            'message' => "Image detected as: {$detected}",
        ]);
    }

    public function marketplace(Request $request)
    {
        $query = Pattern::query()->where('is_public', true);

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhereJsonContains('tags', $search);
            });
        }

        $sortBy = $request->input('sort_by', 'recent');
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
            default:
                $query->orderBy('created_at', 'desc');
        }

        $patterns = $query->get();

        return response()->json([
            'success' => true,
            'patterns' => $patterns,
            'count' => $patterns->count(),
        ]);
    }

    public function updateVisibility(int $patternId, Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'is_public' => 'required|boolean',
            'price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $pattern = Pattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        if ((int) $pattern->user_id !== (int) $request->input('user_id')) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $pattern->update([
            'is_public' => $request->boolean('is_public'),
            'price' => $request->input('price', 0),
            'description' => $request->input('description', $pattern->description),
        ]);

        return response()->json(['success' => true, 'message' => 'Pattern visibility updated successfully']);
    }

    public function recordDownload(int $patternId)
    {
        $pattern = Pattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        $pattern->increment('downloads');

        return response()->json(['success' => true, 'message' => 'Download recorded successfully']);
    }

    public function rate(int $patternId, Request $request)
    {
        $request->validate(['rating' => 'required|numeric|min:1|max:5']);

        $pattern = Pattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        $newRating = (($pattern->rating * $pattern->rating_count) + $request->input('rating')) / ($pattern->rating_count + 1);
        $pattern->update([
            'rating' => $newRating,
            'rating_count' => $pattern->rating_count + 1,
        ]);

        return response()->json(['success' => true, 'message' => 'Rating submitted successfully']);
    }

    public function userStats(string $userId)
    {
        $patterns = Pattern::where('user_id', $userId)->get();

        $stats = [
            'user_id' => $userId,
            'total_patterns' => $patterns->count(),
            'total_downloads' => $patterns->sum('downloads'),
            'total_revenue' => $patterns->sum(fn ($p) => $p->downloads * $p->price),
            'average_rating' => $patterns->avg('rating'),
        ];

        return response()->json(['success' => true, 'stats' => $stats]);
    }
}
