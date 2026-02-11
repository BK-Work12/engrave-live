<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;

class ImageValidator
{
    // Validation thresholds
    const MIN_WIDTH = 100;
    const MAX_WIDTH = 4000;
    const MIN_HEIGHT = 100;
    const MAX_HEIGHT = 4000;
    const MAX_FILE_SIZE = 10485760; // 10MB
    
    const MIN_PATTERN_DENSITY = 8.0;
    const MAX_OUTLINE_DENSITY = 18.0;
    const MIN_WHITE_BACKGROUND_RATIO = 0.7;
    
    // Optimal dimensions for best results
    const OPTIMAL_MIN_SIZE = 500;
    const OPTIMAL_MAX_SIZE = 1500;
    const OPTIMAL_WIDTH_MM_EQUIV = 200; // 200mm = good results

    /**
     * Validate pattern image
     */
    public function validatePatternImage(UploadedFile $file): array
    {
        $errors = [];
        $warnings = [];
        $metadata = [];

        // File size check
        $sizeCheck = $this->validateFileSize($file);
        $errors = array_merge($errors, $sizeCheck['errors']);
        $metadata = array_merge($metadata, $sizeCheck['metadata']);

        if (!empty($sizeCheck['errors'])) {
            return ['is_valid' => false, 'errors' => $errors, 'warnings' => $warnings, 'metadata' => $metadata];
        }

        try {
            $image = imagecreatefromstring(file_get_contents($file->getRealPath()));
            
            if (!$image) {
                return [
                    'is_valid' => false,
                    'errors' => ['Cannot open image file. Please ensure it is a valid image format.'],
                    'warnings' => [],
                    'metadata' => $metadata
                ];
            }

            $width = imagesx($image);
            $height = imagesy($image);
            $metadata['width'] = $width;
            $metadata['height'] = $height;
            $metadata['format'] = $file->getClientOriginalExtension();

            // Dimension check
            $dimCheck = $this->validateDimensions($width, $height);
            $errors = array_merge($errors, $dimCheck['errors']);
            $warnings = array_merge($warnings, $dimCheck['warnings']);
            $metadata = array_merge($metadata, $dimCheck['metadata']);

            if (!empty($dimCheck['errors'])) {
                imagedestroy($image);
                return ['is_valid' => false, 'errors' => $errors, 'warnings' => $warnings, 'metadata' => $metadata];
            }

            // Background check
            $bgCheck = $this->checkBackgroundPurity($image);
            $errors = array_merge($errors, $bgCheck['errors']);
            $warnings = array_merge($warnings, $bgCheck['warnings']);
            $metadata = array_merge($metadata, $bgCheck['metadata']);

            // Complexity check for patterns
            $complexityCheck = $this->checkComplexity($image, 'pattern');
            $errors = array_merge($errors, $complexityCheck['errors']);
            $warnings = array_merge($warnings, $complexityCheck['warnings']);
            $metadata = array_merge($metadata, $complexityCheck['metadata']);

            imagedestroy($image);

            return [
                'is_valid' => empty($errors),
                'errors' => $errors,
                'warnings' => $warnings,
                'metadata' => $metadata
            ];

        } catch (\Exception $e) {
            return [
                'is_valid' => false,
                'errors' => ['Error processing image: ' . $e->getMessage()],
                'warnings' => [],
                'metadata' => $metadata
            ];
        }
    }

    /**
     * Validate outline image
     */
    public function validateOutlineImage(UploadedFile $file): array
    {
        $errors = [];
        $warnings = [];
        $metadata = [];

        $sizeCheck = $this->validateFileSize($file);
        $errors = array_merge($errors, $sizeCheck['errors']);
        $metadata = array_merge($metadata, $sizeCheck['metadata']);

        if (!empty($sizeCheck['errors'])) {
            return ['is_valid' => false, 'errors' => $errors, 'warnings' => $warnings, 'metadata' => $metadata];
        }

        try {
            $image = imagecreatefromstring(file_get_contents($file->getRealPath()));
            
            if (!$image) {
                return [
                    'is_valid' => false,
                    'errors' => ['Cannot open image file.'],
                    'warnings' => [],
                    'metadata' => $metadata
                ];
            }

            $width = imagesx($image);
            $height = imagesy($image);
            $metadata['width'] = $width;
            $metadata['height'] = $height;

            $dimCheck = $this->validateDimensions($width, $height);
            $errors = array_merge($errors, $dimCheck['errors']);
            $warnings = array_merge($warnings, $dimCheck['warnings']);
            $metadata = array_merge($metadata, $dimCheck['metadata']);

            $bgCheck = $this->checkBackgroundPurity($image);
            $errors = array_merge($errors, $bgCheck['errors']);
            $warnings = array_merge($warnings, $bgCheck['warnings']);
            $metadata = array_merge($metadata, $bgCheck['metadata']);

            $complexityCheck = $this->checkComplexity($image, 'outline');
            $errors = array_merge($errors, $complexityCheck['errors']);
            $warnings = array_merge($warnings, $complexityCheck['warnings']);
            $metadata = array_merge($metadata, $complexityCheck['metadata']);

            // Check for gaps in outline
            $gapCheck = $this->checkOutlineGaps($image);
            $errors = array_merge($errors, $gapCheck['errors']);
            $warnings = array_merge($warnings, $gapCheck['warnings']);
            $metadata = array_merge($metadata, $gapCheck['metadata']);

            // Check for shadows and gradients
            $shadowCheck = $this->checkShadowsAndGradients($image);
            $errors = array_merge($errors, $shadowCheck['errors']);
            $warnings = array_merge($warnings, $shadowCheck['warnings']);
            $metadata = array_merge($metadata, $shadowCheck['metadata']);

            // Check for thin areas
            $thinCheck = $this->checkThinAreas($image);
            $warnings = array_merge($warnings, $thinCheck['warnings']);
            $metadata = array_merge($metadata, $thinCheck['metadata']);

            imagedestroy($image);

            return [
                'is_valid' => empty($errors),
                'errors' => $errors,
                'warnings' => $warnings,
                'metadata' => $metadata
            ];

        } catch (\Exception $e) {
            return [
                'is_valid' => false,
                'errors' => ['Error processing image: ' . $e->getMessage()],
                'warnings' => [],
                'metadata' => $metadata
            ];
        }
    }

    /**
     * Auto-detect image type
     */
    public function autoDetectImageType(UploadedFile $file): string
    {
        try {
            $image = imagecreatefromstring(file_get_contents($file->getRealPath()));
            if (!$image) return 'unknown';

            $density = $this->calculateDensity($image);
            imagedestroy($image);

            if ($density < self::MIN_PATTERN_DENSITY) {
                return 'outline';
            } elseif ($density > self::MAX_OUTLINE_DENSITY) {
                return 'pattern';
            }

            return 'unknown';
        } catch (\Exception $e) {
            return 'unknown';
        }
    }

    /**
     * Validate file size
     */
    protected function validateFileSize(UploadedFile $file): array
    {
        $errors = [];
        $sizeMb = $file->getSize() / 1048576;

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors[] = sprintf(
                'File size (%.2fMB) exceeds maximum allowed size of 10MB. Please compress or reduce image dimensions.',
                $sizeMb
            );
        }

        return [
            'errors' => $errors,
            'metadata' => ['file_size_mb' => round($sizeMb, 2)]
        ];
    }

    /**
     * Validate dimensions
     */
    protected function validateDimensions(int $width, int $height): array
    {
        $errors = [];
        $warnings = [];

        if ($width < self::MIN_WIDTH || $height < self::MIN_HEIGHT) {
            $errors[] = sprintf(
                'Image dimensions (%dx%dpx) are too small. Minimum size is %dx%dpx.',
                $width, $height, self::MIN_WIDTH, self::MIN_HEIGHT
            );
        }

        if ($width > self::MAX_WIDTH || $height > self::MAX_HEIGHT) {
            $errors[] = sprintf(
                'Image dimensions (%dx%dpx) are too large. Maximum size is %dx%dpx.',
                $width, $height, self::MAX_WIDTH, self::MAX_HEIGHT
            );
        }

        $aspectRatio = $height > 0 ? $width / $height : 0;
        if ($aspectRatio > 10 || $aspectRatio < 0.1) {
            $warnings[] = sprintf(
                'Unusual aspect ratio (%dx%d). Very elongated images may not produce optimal results.',
                $width, $height
            );
        }

        if ($width > 2000 || $height > 2000) {
            $warnings[] = sprintf(
                'Large image size (%dx%dpx). Consider resizing to 1500px or less for faster processing.',
                $width, $height
            );
        }

        // Check for optimal size (based on user feedback about mm sizes)
        $maxDim = max($width, $height);
        if ($maxDim < self::OPTIMAL_MIN_SIZE) {
            $warnings[] = sprintf(
                'Image may be too small (%dpx max dimension). For best results, use images between %d-%dpx (equivalent to ~200mm).',
                $maxDim, self::OPTIMAL_MIN_SIZE, self::OPTIMAL_MAX_SIZE
            );
        } elseif ($maxDim > self::OPTIMAL_MAX_SIZE && $maxDim <= 2000) {
            $warnings[] = sprintf(
                'Image is larger than optimal (%dpx max dimension). Dimensions between %d-%dpx often produce the best results. Very large images (>250mm equivalent) may cause outline distortion.',
                $maxDim, self::OPTIMAL_MIN_SIZE, self::OPTIMAL_MAX_SIZE
            );
        } elseif ($maxDim > 2000) {
            $warnings[] = sprintf(
                'Very large image (%dpx). This may cause processing issues. Recommended size: %d-%dpx (approximately 150-200mm).',
                $maxDim, self::OPTIMAL_MIN_SIZE, self::OPTIMAL_MAX_SIZE
            );
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'metadata' => [
                'width' => $width,
                'height' => $height,
                'aspect_ratio' => round($aspectRatio, 2),
                'max_dimension' => $maxDim,
                'optimal_size' => $maxDim >= self::OPTIMAL_MIN_SIZE && $maxDim <= self::OPTIMAL_MAX_SIZE
            ]
        ];
    }

    /**
     * Check background purity
     */
    protected function checkBackgroundPurity($image): array
    {
        $errors = [];
        $warnings = [];

        $width = imagesx($image);
        $height = imagesy($image);
        $totalPixels = $width * $height;

        $nearWhiteCount = 0;
        $grayCount = 0;

        // Sample pixels (check every 10th pixel for performance)
        for ($y = 0; $y < $height; $y += 10) {
            for ($x = 0; $x < $width; $x += 10) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                if ($r > 240 && $g > 240 && $b > 240) {
                    $nearWhiteCount++;
                } elseif ($r > 200 && $g > 200 && $b > 200 && ($r < 240 || $g < 240 || $b < 240)) {
                    $grayCount++;
                }
            }
        }

        $sampledPixels = ceil($height / 10) * ceil($width / 10);
        $whiteRatio = $nearWhiteCount / $sampledPixels;
        $grayRatio = $grayCount / $sampledPixels;

        if ($whiteRatio < self::MIN_WHITE_BACKGROUND_RATIO) {
            $errors[] = sprintf(
                'Background is not pure white (%.1f%% white pixels). The image may have shadows, gradients, or a colored background. Please ensure the background is solid white (#FFFFFF).',
                $whiteRatio * 100
            );
        }

        if ($grayRatio > 0.15) {
            $warnings[] = 'Image contains gray areas which may indicate shadows or gradients. Consider cleaning up the image.';
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'metadata' => [
                'white_ratio' => round($whiteRatio, 2),
                'gray_ratio' => round($grayRatio, 2),
                'background_quality' => $whiteRatio > 0.9 ? 'good' : ($whiteRatio > 0.7 ? 'fair' : 'poor')
            ]
        ];
    }

    /**
     * Check complexity
     */
    protected function checkComplexity($image, string $type): array
    {
        $errors = [];
        $warnings = [];

        $density = $this->calculateDensity($image);
        $width = imagesx($image);
        $height = imagesy($image);

        if ($type === 'pattern') {
            if ($density < self::MIN_PATTERN_DENSITY) {
                $errors[] = sprintf(
                    'Image appears too simple for a pattern (density: %.2f%%). Pattern images should contain detailed designs, not empty outlines.',
                    $density
                );
            } elseif ($density > 60) {
                $warnings[] = sprintf(
                    'Pattern is very dense (%.2f%%). Extremely complex patterns may be difficult to scale.',
                    $density
                );
            }
        } elseif ($type === 'outline') {
            if ($density > self::MAX_OUTLINE_DENSITY) {
                $errors[] = sprintf(
                    'Image appears to be a complex pattern (density: %.2f%%) instead of a simple outline. Outline images should be empty silhouettes.',
                    $density
                );
            }

            // Check for highly complex outlines (e.g., full pistol layouts)
            $componentCount = $this->estimateComponentCount($image);
            if ($componentCount > 5) {
                $warnings[] = sprintf(
                    'Very complex outline detected (%d potential components). For best results, consider breaking this into separate components (e.g., grip, slide, frame) and uploading each individually. The AI produces cleaner, more detailed scrollwork on simpler shapes.',
                    $componentCount
                );
            }

            // Check aspect ratio for elongated shapes
            $aspectRatio = $width / max($height, 1);
            if ($aspectRatio > 3 || $aspectRatio < 0.33) {
                $warnings[] = 'Highly elongated shape detected. Very long/thin shapes may have areas where patterns cannot fit properly.';
            }
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'metadata' => [
                'density' => round($density, 2),
                'complexity' => $density > 40 ? 'high' : ($density > 15 ? 'medium' : 'low'),
                'component_count' => $componentCount ?? 0
            ]
        ];
    }

    /**
     * Calculate black pixel density
     */
    protected function calculateDensity($image): float
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $blackCount = 0;
        $totalSampled = 0;

        // Sample every 5th pixel for performance
        for ($y = 0; $y < $height; $y += 5) {
            for ($x = 0; $x < $width; $x += 5) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                if ($r < 128 && $g < 128 && $b < 128) {
                    $blackCount++;
                }
                $totalSampled++;
            }
        }

        return $totalSampled > 0 ? ($blackCount / $totalSampled) * 100 : 0;
    }

    /**
     * Generate helpful error message
     */
    public function generateErrorMessage(array $validation): string
    {
        if ($validation['is_valid']) {
            if (!empty($validation['warnings'])) {
                return "Image validated successfully, but please note:\n" . implode("\n", array_map(fn($w) => "• $w", $validation['warnings']));
            }
            return "Image validated successfully!";
        }

        $message = "Image validation failed:\n\n**Errors:**\n";
        $message .= implode("\n", array_map(fn($e) => "• $e", $validation['errors']));

        if (!empty($validation['warnings'])) {
            $message .= "\n\n**Warnings:**\n";
            $message .= implode("\n", array_map(fn($w) => "• $w", $validation['warnings']));
        }

        $message .= "\n\n**Common Issues:**\n";
        $message .= "• Ensure pure white (#FFFFFF) background\n";
        $message .= "• Check that outlines are completely closed\n";
        $message .= "• Patterns should have detailed designs; outlines should be simple\n";
        $message .= "• Recommended size: 500-1500px on longest side\n";

        return $message;
    }

    /**
     * Check for gaps in outline (unclosed shapes)
     */
    protected function checkOutlineGaps($image): array
    {
        $errors = [];
        $warnings = [];
        $metadata = [];

        $width = imagesx($image);
        $height = imagesy($image);

        // Scan edges for dark pixels - gaps often show as edge-touching areas
        $edgeBlackPixels = 0;
        $totalEdgePixels = 0;

        // Check top and bottom edges
        for ($x = 0; $x < $width; $x += 5) {
            $totalEdgePixels += 2;
            if ($this->isPixelDark($image, $x, 0)) $edgeBlackPixels++;
            if ($this->isPixelDark($image, $x, $height - 1)) $edgeBlackPixels++;
        }

        // Check left and right edges
        for ($y = 0; $y < $height; $y += 5) {
            $totalEdgePixels += 2;
            if ($this->isPixelDark($image, 0, $y)) $edgeBlackPixels++;
            if ($this->isPixelDark($image, $width - 1, $y)) $edgeBlackPixels++;
        }

        $edgeBlackRatio = $edgeBlackPixels / max($totalEdgePixels, 1);
        $metadata['edge_black_ratio'] = round($edgeBlackRatio, 3);

        // Detect potential gaps by looking for thin lines
        $thinLineCount = $this->detectThinLines($image);
        $metadata['thin_line_count'] = $thinLineCount;

        if ($edgeBlackRatio > 0.1) {
            $warnings[] = sprintf(
                'Outline touches image edges (%.1f%% of edges). This may indicate an unclosed shape or cropped outline. Ensure your outline is fully contained within the image borders.',
                $edgeBlackRatio * 100
            );
        }

        if ($thinLineCount > 5) {
            $warnings[] = sprintf(
                'Multiple thin lines detected (%d). Outlines should be closed shapes. Check for small gaps, especially at corners or where lines meet.',
                $thinLineCount
            );
        }

        // Use flood fill to detect discontinuities
        $gapDetected = $this->floodFillGapDetection($image);
        if ($gapDetected) {
            $errors[] = 'Outline appears to have gaps or is not a closed shape. The AI requires completely closed outlines to fill properly. Please check your image in an editor and ensure all paths are closed.';
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'metadata' => $metadata
        ];
    }

    /**
     * Check for shadows, reflections, and gradients
     */
    protected function checkShadowsAndGradients($image): array
    {
        $errors = [];
        $warnings = [];
        $metadata = [];

        $width = imagesx($image);
        $height = imagesy($image);

        $gradientPixels = 0;
        $totalSampled = 0;

        // Sample for gradient colors (gray values between pure black and white)
        for ($y = 0; $y < $height; $y += 10) {
            for ($x = 0; $x < $width; $x += 10) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                // Detect mid-tone grays (shadows/gradients)
                if ($r > 50 && $r < 230 && $g > 50 && $g < 230 && $b > 50 && $b < 230) {
                    if (abs($r - $g) < 30 && abs($g - $b) < 30) {
                        $gradientPixels++;
                    }
                }

                $totalSampled++;
            }
        }

        $gradientRatio = $gradientPixels / max($totalSampled, 1);
        $metadata['gradient_ratio'] = round($gradientRatio, 3);

        if ($gradientRatio > 0.05) {
            $warnings[] = sprintf(
                'Detected gradients or shadows (%.1f%% gray pixels). Source images should have pure black outlines on pure white backgrounds. Subtle shadows, reflections, or anti-aliasing can prevent proper filling.',
                $gradientRatio * 100
            );
        }

        // Check for color variations that suggest non-uniform background
        $colorVariance = $this->calculateColorVariance($image);
        $metadata['background_variance'] = round($colorVariance, 2);

        if ($colorVariance > 20) {
            $warnings[] = 'Background color is not uniform. Ensure a solid white background with no gradients or textures.';
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'metadata' => $metadata
        ];
    }

    /**
     * Check for thin areas that may not fill well
     */
    protected function checkThinAreas($image): array
    {
        $warnings = [];
        $metadata = [];

        $width = imagesx($image);
        $height = imagesy($image);

        // Detect narrow passages or thin areas
        $thinAreaCount = 0;
        $minThickness = 20; // pixels

        // Sample horizontal strips
        for ($y = 0; $y < $height; $y += 20) {
            $blackStart = -1;
            for ($x = 0; $x < $width; $x++) {
                if ($this->isPixelDark($image, $x, $y)) {
                    if ($blackStart == -1) $blackStart = $x;
                } else {
                    if ($blackStart >= 0) {
                        $thickness = $x - $blackStart;
                        if ($thickness < $minThickness) {
                            $thinAreaCount++;
                        }
                        $blackStart = -1;
                    }
                }
            }
        }

        $metadata['thin_area_count'] = $thinAreaCount;

        if ($thinAreaCount > 10) {
            $warnings[] = sprintf(
                'Detected %d thin areas in the outline. Areas thinner than ~20px may not fill properly with patterns. Consider simplifying very narrow sections.',
                $thinAreaCount
            );
        }

        return [
            'warnings' => $warnings,
            'metadata' => $metadata
        ];
    }

    /**
     * Estimate number of distinct components in the outline
     */
    protected function estimateComponentCount($image): int
    {
        $width = imagesx($image);
        $height = imagesy($image);

        // Count discrete black regions using simplified connected component analysis
        $visited = [];
        $componentCount = 0;

        for ($y = 0; $y < $height; $y += 30) {
            for ($x = 0; $x < $width; $x += 30) {
                $key = $x . '_' . $y;
                if (!isset($visited[$key]) && $this->isPixelDark($image, $x, $y)) {
                    $componentCount++;
                    $this->markComponent($image, $x, $y, $width, $height, $visited);
                }
            }
        }

        return $componentCount;
    }

    /**
     * Mark a component as visited (simplified flood fill)
     */
    protected function markComponent($image, $startX, $startY, $width, $height, &$visited): void
    {
        $queue = [[$startX, $startY]];
        $maxIterations = 100; // Prevent infinite loops
        $iterations = 0;

        while (!empty($queue) && $iterations < $maxIterations) {
            $iterations++;
            [$x, $y] = array_shift($queue);
            $key = $x . '_' . $y;

            if (isset($visited[$key]) || $x < 0 || $x >= $width || $y < 0 || $y >= $height) {
                continue;
            }

            if (!$this->isPixelDark($image, $x, $y)) {
                continue;
            }

            $visited[$key] = true;

            // Add neighbors (sample with larger steps for performance)
            $queue[] = [$x + 30, $y];
            $queue[] = [$x - 30, $y];
            $queue[] = [$x, $y + 30];
            $queue[] = [$x, $y - 30];
        }
    }

    /**
     * Simple flood fill gap detection
     */
    protected function floodFillGapDetection($image): bool
    {
        $width = imagesx($image);
        $height = imagesy($image);

        // Find first dark pixel
        $startX = -1;
        $startY = -1;

        for ($y = 0; $y < $height && $startX == -1; $y += 5) {
            for ($x = 0; $x < $width && $startX == -1; $x += 5) {
                if ($this->isPixelDark($image, $x, $y)) {
                    $startX = $x;
                    $startY = $y;
                }
            }
        }

        if ($startX == -1) {
            return false; // No dark pixels found
        }

        // Count total dark pixels
        $totalDarkPixels = 0;
        for ($y = 0; $y < $height; $y += 5) {
            for ($x = 0; $x < $width; $x += 5) {
                if ($this->isPixelDark($image, $x, $y)) {
                    $totalDarkPixels++;
                }
            }
        }

        // Flood fill from start point
        $visited = [];
        $this->floodFillCount($image, $startX, $startY, $width, $height, $visited);

        $reachablePixels = count($visited);

        // If we can't reach most dark pixels, there are gaps
        $reachabilityRatio = $reachablePixels / max($totalDarkPixels, 1);

        return $reachabilityRatio < 0.7;
    }

    /**
     * Count reachable pixels via flood fill
     */
    protected function floodFillCount($image, $startX, $startY, $width, $height, &$visited): void
    {
        $queue = [[$startX, $startY]];
        $maxIterations = 1000;
        $iterations = 0;

        while (!empty($queue) && $iterations < $maxIterations) {
            $iterations++;
            [$x, $y] = array_shift($queue);
            $key = $x . '_' . $y;

            if (isset($visited[$key]) || $x < 0 || $x >= $width || $y < 0 || $y >= $height) {
                continue;
            }

            if (!$this->isPixelDark($image, $x, $y)) {
                continue;
            }

            $visited[$key] = true;

            $queue[] = [$x + 5, $y];
            $queue[] = [$x - 5, $y];
            $queue[] = [$x, $y + 5];
            $queue[] = [$x, $y - 5];
        }
    }

    /**
     * Check if a pixel is dark
     */
    protected function isPixelDark($image, int $x, int $y): bool
    {
        if ($x < 0 || $x >= imagesx($image) || $y < 0 || $y >= imagesy($image)) {
            return false;
        }

        $rgb = imagecolorat($image, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;

        return ($r < 128 && $g < 128 && $b < 128);
    }

    /**
     * Detect thin lines in image
     */
    protected function detectThinLines($image): int
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $thinLineCount = 0;

        // Sample horizontal and vertical lines
        for ($y = 0; $y < $height; $y += 20) {
            $consecutiveDark = 0;
            for ($x = 0; $x < $width; $x++) {
                if ($this->isPixelDark($image, $x, $y)) {
                    $consecutiveDark++;
                } else {
                    if ($consecutiveDark > 0 && $consecutiveDark < 5) {
                        $thinLineCount++;
                    }
                    $consecutiveDark = 0;
                }
            }
        }

        return $thinLineCount;
    }

    /**
     * Calculate color variance in background
     */
    protected function calculateColorVariance($image): float
    {
        $width = imagesx($image);
        $height = imagesy($image);
        
        $rValues = [];
        $gValues = [];
        $bValues = [];

        // Sample bright pixels (likely background)
        for ($y = 0; $y < $height; $y += 20) {
            for ($x = 0; $x < $width; $x += 20) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                if ($r > 200 && $g > 200 && $b > 200) {
                    $rValues[] = $r;
                    $gValues[] = $g;
                    $bValues[] = $b;
                }
            }
        }

        if (empty($rValues)) {
            return 0;
        }

        $rVariance = $this->variance($rValues);
        $gVariance = $this->variance($gValues);
        $bVariance = $this->variance($bValues);

        return ($rVariance + $gVariance + $bVariance) / 3;
    }

    /**
     * Calculate statistical variance
     */
    protected function variance(array $values): float
    {
        if (empty($values)) {
            return 0;
        }

        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($v) => pow($v - $mean, 2), $values);
        return array_sum($squaredDiffs) / count($values);
    }
}
