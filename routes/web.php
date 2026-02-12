<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'));
Route::get('/create', fn () => Inertia::render('Create'));

Route::get('/style-examples', fn () => Inertia::render('StyleExamples'));
Route::get('/how-it-works', fn () => Inertia::render('HowItWorks'));
Route::get('/pricing', fn () => Inertia::render('Pricing'));
Route::get('/faq', fn () => Inertia::render('FAQ'));

Route::get('/login', fn () => Inertia::render('Login'))->name('login');
Route::get('/signup', fn () => Inertia::render('SignUp'));
Route::get('/forgot-password', fn () => Inertia::render('Forget'))->name('password.request');
Route::post('/forgot-password', [App\Http\Controllers\PasswordResetController::class, 'sendResetLinkEmail'])->name('password.email');
Route::get('/reset-password/{token}', function (string $token) {
    return Inertia::render('UpdatePassword', ['token' => $token, 'email' => request()->email]);
})->name('password.reset');
Route::post('/reset-password', [App\Http\Controllers\PasswordResetController::class, 'resetPassword'])->name('password.update');

Route::get('/verify', fn () => Inertia::render('Verify'));

Route::post('/login', [App\Http\Controllers\AuthController::class, 'login'])->name('login.post');
Route::post('/signup', [App\Http\Controllers\AuthController::class, 'register'])->name('signup.post');
Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::post('/designs/upload', [App\Http\Controllers\DesignController::class, 'store'])->name('designs.store');
    Route::put('/designs/{design}', [App\Http\Controllers\DesignController::class, 'update'])->name('designs.update');
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::post('/checkout', [App\Http\Controllers\PaymentController::class, 'checkout'])->name('checkout');
    Route::get('/checkout/success', [App\Http\Controllers\PaymentController::class, 'success'])->name('checkout.success');
    Route::post('/credits/deduct', [App\Http\Controllers\DesignController::class, 'deductCredit'])->name('credits.deduct');
    
    // Pattern Management Routes
    Route::prefix('api/patterns')->name('patterns.')->group(function () {
        Route::post('/validate/pattern', [App\Http\Controllers\PatternController::class, 'validatePattern'])->name('validate.pattern');
        Route::post('/validate/outline', [App\Http\Controllers\PatternController::class, 'validateOutline'])->name('validate.outline');
        Route::post('/validate/auto', [App\Http\Controllers\PatternController::class, 'autoDetect'])->name('validate.auto');
        Route::post('/upload', [App\Http\Controllers\PatternController::class, 'upload'])->name('upload');
        Route::get('/user', [App\Http\Controllers\PatternController::class, 'index'])->name('index');
        Route::get('/user/stats', [App\Http\Controllers\PatternController::class, 'userStats'])->name('stats');
        Route::get('/{pattern}', [App\Http\Controllers\PatternController::class, 'show'])->name('show');
        Route::put('/{pattern}', [App\Http\Controllers\PatternController::class, 'update'])->name('update');
        Route::delete('/{pattern}', [App\Http\Controllers\PatternController::class, 'destroy'])->name('destroy');
        Route::get('/{pattern}/download', [App\Http\Controllers\PatternController::class, 'download'])->name('download');
        Route::post('/{pattern}/rate', [App\Http\Controllers\PatternController::class, 'rate'])->name('rate');
    });
});

// Public pattern marketplace routes
Route::prefix('api/marketplace')->name('marketplace.')->group(function () {
    Route::get('/patterns', [App\Http\Controllers\PatternController::class, 'list'])->name('patterns');
});

Route::get('/ai-design-generator', fn () => Inertia::render('AIDesignGenerator'));
Route::get('/seamless-patterns', fn () => Inertia::render('SeamlessPatternCreator'));
Route::get("/generator", fn () => Inertia::render("Generator"));
Route::get("/svg-tracing-tool", fn () => Inertia::render("SVGTracingTool"));
Route::get('/image-editor', [App\Http\Controllers\ImageEditorController::class, 'show']);
Route::get('/svg-tracing', fn () => Inertia::render('SVGTracingTool'));
Route::get('/outline-generator', fn () => Inertia::render('OutlineGenerator'));
Route::get('/pattern-upload', fn () => Inertia::render('PatternUpload'));
Route::get('/pattern-marketplace', fn () => Inertia::render('PatternMarketplace'));

// --- Generator API routes (replaces Python FastAPI backend) ---
Route::post('/api/generator/generate', [App\Http\Controllers\GeneratorController::class, 'generate']);
Route::post('/api/generator/generate-with-options', [App\Http\Controllers\GeneratorController::class, 'generateWithOptions']);
Route::post('/api/generate-background-fill', [App\Http\Controllers\GeneratorController::class, 'generateBackgroundFill']);
Route::post('/api/generate-outline', [App\Http\Controllers\OutlineController::class, 'generate']);
Route::get('/api/download/{filename}', [App\Http\Controllers\GeneratorController::class, 'download']);
Route::get('/api/image-base64/{filename}', [App\Http\Controllers\GeneratorController::class, 'imageBase64']);

// Pattern library extended routes
Route::get('/api/pattern-library/list', [App\Http\Controllers\PatternLibraryController::class, 'listLibraries']);
Route::get('/api/pattern-library/list/{category}', [App\Http\Controllers\PatternLibraryController::class, 'listCategory']);
Route::get('/api/pattern-library/pattern/{pattern}', [App\Http\Controllers\PatternLibraryController::class, 'show']);
Route::post('/api/pattern-library/upload', [App\Http\Controllers\PatternLibraryController::class, 'upload']);
Route::delete('/api/pattern-library/pattern/{pattern}', [App\Http\Controllers\PatternLibraryController::class, 'delete']);
Route::get('/api/pattern-library/user-patterns', [App\Http\Controllers\PatternLibraryController::class, 'userPatterns']);
Route::post('/api/pattern-library/validate/pattern', [App\Http\Controllers\PatternLibraryController::class, 'validatePattern']);
Route::post('/api/pattern-library/validate/outline', [App\Http\Controllers\PatternLibraryController::class, 'validateOutline']);
Route::post('/api/pattern-library/validate/auto-detect', [App\Http\Controllers\PatternLibraryController::class, 'autoDetect']);

// Marketplace extended routes
Route::get('/api/marketplace/list', [App\Http\Controllers\PatternLibraryController::class, 'marketplace']);
Route::put('/api/marketplace/pattern/{pattern}/visibility', [App\Http\Controllers\PatternLibraryController::class, 'updateVisibility']);
Route::post('/api/marketplace/pattern/{pattern}/download', [App\Http\Controllers\PatternLibraryController::class, 'recordDownload']);
Route::post('/api/marketplace/pattern/{pattern}/rate', [App\Http\Controllers\PatternLibraryController::class, 'rate']);
Route::get('/api/marketplace/user/{userId}/stats', [App\Http\Controllers\PatternLibraryController::class, 'userStats']);

// SVG tool routes
Route::post('/api/svg-tool/process', [App\Http\Controllers\SvgToolController::class, 'process']);
Route::post('/api/svg-tool/generate', [App\Http\Controllers\SvgToolController::class, 'generate']);
Route::get('/api/svg-tool/default-settings', [App\Http\Controllers\SvgToolController::class, 'defaultSettings']);