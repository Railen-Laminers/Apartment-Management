<?php

namespace App\Traits;

use App\Models\Plan;

trait HandlesPlans
{
    /**
     * Enforce only one default plan in the system.
     * Only free (price = 0) plans can be set as default.
     */
    protected function enforceDefaultPlan(array &$validated, ?int $excludeId = null): ?\Illuminate\Http\JsonResponse
    {
        if (!empty($validated['is_default'])) {
            if (($validated['price'] ?? 0) > 0) {
                return response()->json([
                    'message' => 'Only free plans (price = 0) can be set as default.'
                ], 422);
            }

            // Unset other default plans
            Plan::where('is_default', true)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->update(['is_default' => false]);
        }

        return null;
    }

    /**
     * Create a fallback free plan if no default free plan exists.
     */
    protected function createFallbackDefaultPlanIfMissing(): ?Plan
    {
        $existing = Plan::where('is_default', true)
            ->where('is_active', true)
            ->where('price', 0)
            ->first();

        if (!$existing) {
            return Plan::create([
                'name' => 'Free Plan',
                'description' => 'Auto-generated default free plan.',
                'price' => 0,
                'duration_days' => null,
                'allowed_properties' => 1,
                'allowed_units' => 1,
                'enable_notifications' => json_encode(['email']),
                'is_default' => true,
                'is_active' => true,
            ]);
        }

        return $existing;
    }
}
