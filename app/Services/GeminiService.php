<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.gemini.key');
        $this->model = (string) config('services.gemini.model', 'gemini-2.5-flash-image');

        if ($this->apiKey === '') {
            throw new \RuntimeException('GEMINI_API_KEY is not configured.');
        }
    }

    public function generateImage(array $parts, array $generationConfig = []): array
    {
        $url = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
            $this->model
        );

        $payload = [
            'contents' => [
                [
                    'parts' => $parts,
                ],
            ],
        ];

        if (!empty($generationConfig)) {
            $payload['generationConfig'] = $generationConfig;
        }

        // Retry with exponential backoff for resilience
        $maxAttempts = 3;
        $attempt = 0;
        $lastError = null;

        while ($attempt < $maxAttempts) {
            try {
                $attempt++;
                
                $response = Http::withHeaders([
                        'x-goog-api-key' => $this->apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(300)  // 5 minute timeout
                    ->connectTimeout(30)  // 30 second connection timeout
                    ->post($url, $payload);

                if (!$response->successful()) {
                    $message = $response->json('error.message')
                        ?? $response->body()
                        ?? 'Unknown Gemini API error';
                    throw new \RuntimeException('Gemini API request failed: ' . $message);
                }

                return $response->json();
            } catch (\Exception $e) {
                $lastError = $e;
                
                // If it's the last attempt, throw the error
                if ($attempt >= $maxAttempts) {
                    throw $e;
                }
                
                // Exponential backoff: 2, 4, 8 seconds
                $backoffSeconds = pow(2, $attempt);
                sleep($backoffSeconds);
            }
        }

        throw $lastError ?? new \RuntimeException('Gemini API request failed after retries');
    }

    public function extractInlineImageBase64(array $response): ?string
    {
        $candidates = $response['candidates'] ?? [];
        if (empty($candidates)) {
            return null;
        }

        $parts = $candidates[0]['content']['parts'] ?? [];
        foreach ($parts as $part) {
            if (isset($part['inlineData']['data'])) {
                return $part['inlineData']['data'];
            }
        }

        return null;
    }
}
