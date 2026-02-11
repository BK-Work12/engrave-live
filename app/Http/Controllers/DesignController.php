<?php

namespace App\Http\Controllers;

use App\Models\Design;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class DesignController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,svg|max:10240', // 10MB max
        ]);

        $user = $request->user();

        $path = $request->file('image')->store('designs', 'public');

        $design = Design::create([
            'user_id' => $user->id,
            'name' => $request->file('image')->getClientOriginalName(),
            'file_path' => '/storage/' . $path,
            'status' => 'uploaded'
        ]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'design' => $design
        ]);
    }

    public function deductCredit(Request $request)
    {
        $user = $request->user();

        if ($user->credits < 1) {
            return response()->json([
                'error' => 'Insufficient credits.'
            ], 403);
        }

        $user->decrement('credits', 1);

        return response()->json([
            'message' => 'Credit deducted',
            'remaining_credits' => $user->credits
        ]);
    }

    public function update(Request $request, Design $design)
    {
         // Ensure the user owns the design
        if ($design->user_id !== Auth::id() && Auth::check()) {
            abort(403);
        }

        $validated = $request->validate([
            'threshold' => 'integer|min:0|max:255',
            'contrast' => 'integer|min:0|max:100',
            'invert' => 'boolean',
            'despeckle' => 'numeric',
            // Add other settings as needed
        ]);

        $currentSettings = $design->settings ?? [];
        $newSettings = array_merge($currentSettings, $validated);

        $design->update([
            'settings' => $newSettings,
            'status' => 'processing', // Mock state change
        ]);

        // Here we would trigger the actual image processing job
        // dispatch(new ProcessDesignJob($design));

        return response()->json([
            'message' => 'Settings updated',
            'design' => $design
        ]);
    }
}
