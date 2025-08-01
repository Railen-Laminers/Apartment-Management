<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

trait HandlesApiExceptions
{
    /**
     * Wraps any logic with try-catch to safely handle exceptions and log details.
     */
    protected function safeCall(callable $callback, string $context = 'API Operation', array $extra = []): JsonResponse
    {
        try {
            return $callback();
        } catch (Throwable $e) {
            Log::error("{$context} failed: " . $e->getMessage(), array_merge([
                'exception' => $e,
            ], $extra));

            return response()->json([
                'message' => 'Something went wrong.',
                'error' => 'Internal Server Error',
            ], 500);
        }
    }
}
