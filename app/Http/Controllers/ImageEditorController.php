<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ImageEditorController extends Controller
{
    public function show()
    {
        // Image is passed via sessionStorage from the client side
        // This page just renders the editor interface
        return Inertia::render('ImageEditor');
    }
}
