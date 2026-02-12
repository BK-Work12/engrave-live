<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ImageEditorController extends Controller
{
    public function show()
    {
        $imageUrl = request()->query('image');
        
        if (!$imageUrl) {
            return Inertia::render('ImageEditor', [
                'imageUrl' => null,
                'error' => 'No image URL provided'
            ]);
        }
        
        return Inertia::render('ImageEditor', [
            'imageUrl' => $imageUrl,
        ]);
    }
}
