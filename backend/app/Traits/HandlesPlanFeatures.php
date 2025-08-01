<?php

namespace App\Traits;

use App\Models\Plan;
use Illuminate\Support\Facades\Log;
use Exception;

trait HandlesPlanFeatures
{
    /**
     * Get the user's active plan or fallback to default plan.
     */
    protected function getEffectivePlan($user)
    {
        try {
            $paidSub = $user->subscriptions()
                ->where('status', 'active')
                ->whereHas('plan', fn($q) => $q->where('is_default', false))
                ->with('plan')
                ->first();

            return $paidSub?->plan ?? Plan::where('is_default', true)
                ->where('is_active', true)
                ->first();
        } catch (Exception $e) {
            Log::error('Error in getEffectivePlan: ' . $e->getMessage(), ['exception' => $e]);
            return null;
        }
    }

    /**
     * Get editable property IDs up to the plan's property limit.
     */
    protected function getEditableIds($user, $relation, $limit)
    {
        if ($limit === null || $limit == 0) {
            return $user->$relation()->pluck('id')->toArray(); // No limit
        }

        return $user->$relation()
            ->orderBy('created_at')
            ->pluck('id')
            ->take($limit)
            ->toArray();
    }

    /**
     * Get editable unit IDs for a specific property based on unit limit.
     * This enforces per-property unit limits (Option 2).
     */
    protected function getEditableUnitIdsForProperty($property, $limit)
    {
        $unitIds = $property->units()
            ->orderBy('created_at')
            ->pluck('id');

        return ($limit === null || $limit == 0)
            ? $unitIds->toArray()
            : $unitIds->take($limit)->toArray();
    }

    /**
     * Fallback response for unhandled API exceptions.
     */
    protected function handleException(\Throwable $e, string $context, array $extra = [])
    {
        Log::error("$context error", array_merge([
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], $extra));

        return response()->json(['message' => 'Something went wrong.'], 500);
    }
}
