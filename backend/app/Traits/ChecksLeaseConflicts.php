<?php

namespace App\Traits;

use App\Models\Lease;
use Illuminate\Support\Carbon;

trait ChecksLeaseConflicts
{
    /**
     * Returns true if the unit has an active or pending lease
     * that hasn't ended yet (end_date >= today).
     *
     * Optionally exclude one lease by its ID.
     */
    protected function unitHasLeaseConflict(int $unitId, ?int $excludeLeaseId = null): bool
    {
        $today = Carbon::today()->toDateString();

        return Lease::where('unit_id', $unitId)
            ->when($excludeLeaseId, fn($q) => $q->where('id', '!=', $excludeLeaseId))
            ->whereIn('status', ['active', 'pending'])
            ->whereDate('end_date', '>=', $today)
            ->exists();
    }

    /**
     * Can we safely mark the unit available?
     */
    protected function canMarkUnitAvailable(int $unitId, ?int $excludeLeaseId = null): bool
    {
        return !$this->unitHasLeaseConflict($unitId, $excludeLeaseId);
    }
}
