<?php

namespace App\Traits;

use App\Models\Subscription;
use App\Models\Plan;

trait HandlesSubscriptions
{
    /**
     * Check if user already has an active paid subscription.
     */
    protected function landlordHasActivePaidSubscription($user): bool
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereHas('plan', fn($q) => $q->where('is_default', false))
            ->exists();
    }

    /**
     * Check if user already has a pending subscription for the same plan.
     */
    protected function landlordHasPendingSubscriptionForPlan($user, $planId): bool
    {
        return $user->subscriptions()
            ->where('status', 'pending')
            ->where('plan_id', $planId)
            ->exists();
    }

    /**
     * Expire all active, non-default subscriptions.
     */
    protected function expirePreviousPaidSubscriptions($user)
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereHas('plan', fn($q) => $q->where('is_default', false))
            ->update(['status' => 'expired']);
    }

    /**
     * Create a new pending subscription.
     */
    protected function createPendingSubscription($user, $planId)
    {
        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $planId,
            'status' => 'pending',
            'started_at' => null,
            'ends_at' => null,
        ]);
    }

    /**
     * Get the current default free plan (price = 0 and is_default).
     */
    protected function getDefaultFreePlan(): ?Plan
    {
        return Plan::where('is_default', true)
            ->where('is_active', true)
            ->where('price', 0)
            ->first();
    }
}
