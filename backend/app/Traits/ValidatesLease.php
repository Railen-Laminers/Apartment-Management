<?php

namespace App\Traits;

use App\Models\Lease;

trait ValidatesLease
{
    /**
     * Ensure the lease belongs to the current user and is active.
     */
    public function getValidTenantLease(int $leaseId, $user, bool $mustBeActive = true): ?Lease
    {
        $query = Lease::where('id', $leaseId)
            ->where('tenant_id', $user->id);

        if ($mustBeActive) {
            $query->where('status', 'active');
        }

        return $query->with(['unit.property'])->first();
    }
}
