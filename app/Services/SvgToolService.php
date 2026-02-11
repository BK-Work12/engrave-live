<?php

namespace App\Services;

class SvgToolService
{
    public function getDefaultSettings(): array
    {
        return [
            'stroke_width' => 1.0,
            'stroke_color' => '#000000',
            'fill_color' => '#FFFFFF',
            'background_color' => '#FFFFFF',
            'scale' => 1.0,
            'optimize' => false,
        ];
    }

    public function validateSettings(array $settings): array
    {
        $validated = $this->getDefaultSettings();

        if (isset($settings['stroke_width'])) {
            $value = (float) $settings['stroke_width'];
            $validated['stroke_width'] = $value >= 0 ? $value : 0;
        }

        if (isset($settings['stroke_color'])) {
            $color = trim((string) $settings['stroke_color']);
            if ($this->isColorValue($color)) {
                $validated['stroke_color'] = $this->normalizeColor($color);
            }
        }

        if (isset($settings['fill_color'])) {
            $color = trim((string) $settings['fill_color']);
            if ($this->isColorValue($color, true)) {
                $validated['fill_color'] = $this->normalizeColor($color);
            }
        }

        if (isset($settings['background_color'])) {
            $color = trim((string) $settings['background_color']);
            if ($this->isColorValue($color)) {
                $validated['background_color'] = $this->normalizeColor($color);
            }
        }

        if (isset($settings['scale'])) {
            $value = (float) $settings['scale'];
            $validated['scale'] = $value > 0 ? $value : 1.0;
        }

        if (isset($settings['optimize'])) {
            $validated['optimize'] = (bool) $settings['optimize'];
        }

        return $validated;
    }

    public function processSvg(string $svgContent, array $settings): string
    {
        $svg = trim($svgContent);

        $strokeWidth = $settings['stroke_width'] ?? 1.0;
        $strokeColor = $settings['stroke_color'] ?? '#000000';
        $fillColor = $settings['fill_color'] ?? '#FFFFFF';
        $backgroundColor = $settings['background_color'] ?? '#FFFFFF';
        $scale = $settings['scale'] ?? 1.0;
        $optimize = (bool) ($settings['optimize'] ?? false);

        if ($strokeWidth != 1.0) {
            $svg = preg_replace('/stroke-width=["\"]?([\d.]+)["\"]?/i', 'stroke-width="' . $strokeWidth . '"', $svg);
            if (stripos($svg, 'stroke-width') === false) {
                $svg = preg_replace('/(<path[^>]*stroke[^>]*>)/i', '$1 stroke-width="' . $strokeWidth . '"', $svg);
            }
        }

        if (strcasecmp($strokeColor, '#000000') !== 0) {
            $svg = preg_replace('/stroke=["\"]?#?([0-9a-fA-F]{3,6})["\"]?/i', 'stroke="' . $strokeColor . '"', $svg);
            if (stripos($svg, 'stroke=') === false) {
                $svg = preg_replace('/(<path[^>]*>)/i', '$1 stroke="' . $strokeColor . '"', $svg);
            }
        }

        if (!empty($fillColor)) {
            $svg = preg_replace('/fill=["\"]?(none|#[0-9a-fA-F]{3,6}|[a-zA-Z]+)["\"]?/i', 'fill="' . $fillColor . '"', $svg);
            if (stripos($svg, 'fill=') === false) {
                $svg = preg_replace('/(<path[^>]*>)/i', '$1 fill="' . $fillColor . '"', $svg);
            }
        }

        if (strcasecmp($backgroundColor, '#FFFFFF') !== 0) {
            if (preg_match('/(<svg[^>]*>)/i', $svg, $match)) {
                $bgRect = $this->buildBackgroundRect($svg, $backgroundColor);
                $svg = str_replace($match[1], $match[1] . "\n" . $bgRect, $svg);
            }
        }

        if ($scale != 1.0) {
            if (preg_match('/<svg[^>]*>(.*?)<\/svg>/is', $svg, $match)) {
                $inner = $match[1];
                $scaled = '<g transform="scale(' . $scale . ')">' . $inner . '</g>';
                $svg = str_replace($inner, $scaled, $svg);
            }
        }

        if ($optimize) {
            $svg = preg_replace('/<!--.*?-->/s', '', $svg);
            $svg = preg_replace('/\s+/', ' ', $svg);
            $svg = preg_replace('/>\s+</', '><', $svg);
        }

        return $svg;
    }

    private function buildBackgroundRect(string $svg, string $color): string
    {
        if (preg_match('/viewBox=["\"]([^"\"]+)["\"]/', $svg, $match)) {
            $parts = preg_split('/\s+/', trim($match[1]));
            if (count($parts) >= 4) {
                return sprintf(
                    '<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>',
                    $parts[0],
                    $parts[1],
                    $parts[2],
                    $parts[3],
                    $color
                );
            }
        }

        if (preg_match('/width=["\"]([^"\"]+)["\"]/', $svg, $wMatch) && preg_match('/height=["\"]([^"\"]+)["\"]/', $svg, $hMatch)) {
            return sprintf(
                '<rect width="%s" height="%s" fill="%s"/>',
                $wMatch[1],
                $hMatch[1],
                $color
            );
        }

        return sprintf('<rect width="100%%" height="100%%" fill="%s"/>', $color);
    }

    private function isColorValue(string $color, bool $allowNone = false): bool
    {
        if ($allowNone && in_array(strtolower($color), ['none', 'transparent'], true)) {
            return true;
        }

        return (bool) preg_match('/^#?[0-9a-fA-F]{3,6}$/', $color);
    }

    private function normalizeColor(string $color): string
    {
        if (in_array(strtolower($color), ['none', 'transparent'], true)) {
            return strtolower($color);
        }

        return $color[0] === '#' ? $color : '#' . $color;
    }
}
