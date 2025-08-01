<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lease;
use App\Models\Unit;
use App\Events\SignificantNotificationEvent;
use App\Traits\HandlesApiExceptions;
use App\Traits\HandlesPlanFeatures;
use App\Traits\PreventsDuplicates;
use App\Traits\ChecksLeaseConflicts;

class LeaseController extends Controller
{
    use HandlesApiExceptions, HandlesPlanFeatures, PreventsDuplicates, ChecksLeaseConflicts;

    public function indexLandlord(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $leases = Lease::whereIn('unit_id', $request->user()->units()->pluck('units.id'))
                ->with(['unit.property', 'tenant'])
                ->get();

            return response()->json($leases);
        }, 'Listing landlord leases', ['user_id' => $request->user()->id]);
    }

    public function indexTenant(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $leases = $request->user()
                ->leases()
                ->with('unit.property')
                ->get();

            return response()->json($leases);
        }, 'Listing tenant leases', ['user_id' => $request->user()->id]);
    }

    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'unit_id' => 'required|exists:units,id',
                'tenant_id' => 'required|exists:users,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'security_deposit' => 'required|numeric|min:0',
                'contract_terms' => 'nullable|array',
                'contract_terms.rent_due_day' => 'nullable|integer|min:1|max:31',
                'contract_terms.grace_period_days' => 'nullable|integer|min:0|max:15',
                'contract_terms.other_terms' => 'nullable|array',
                'contract_terms.other_terms.*' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'auto_renew' => 'boolean',
            ]);

            $user = $request->user();
            $unit = Unit::with('property')->findOrFail($data['unit_id']);

            if ($unit->property->owner_id !== $user->id) {
                return response()->json(['message' => 'You do not own this unit.'], 403);
            }

            if (!$unit->is_available) {
                return response()->json(['message' => 'This unit is not available for leasing.'], 400);
            }

            if ($this->unitHasLeaseConflict($unit->id)) {
                return response()->json(['message' => 'This unit already has an active or pending lease.'], 409);
            }

            $limit = $this->getEffectivePlan($user)?->allowed_units;
            $activeCount = Lease::whereIn('unit_id', $user->units()->pluck('units.id'))
                ->where('status', 'active')
                ->count();

            if ($limit !== null && $limit > 0 && $activeCount >= $limit) {
                return response()->json(['message' => 'Lease limit reached for your current plan.'], 403);
            }

            if ($this->isDuplicate(new Lease(), $request, ['unit_id', 'tenant_id', 'start_date', 'end_date'])) {
                return response()->json(['message' => 'A similar lease already exists.'], 409);
            }

            $defaultTerms = [
                'rent_due_day' => 1,
                'grace_period_days' => 5,
                'other_terms' => [],
            ];
            $data['contract_terms'] = array_merge($defaultTerms, $data['contract_terms'] ?? []);

            $lease = Lease::create(array_merge($data, ['status' => 'pending']));

            // event(new SignificantNotificationEvent(
            //     user_id: $data['tenant_id'],
            //     subject: 'New Lease Created',
            //     message: "A new lease has been created for your unit at {$unit->property->name}. Please wait for activation."
            // ));

            $lease->unit->update(['is_available' => false]);

            return response()->json($lease, 201);
        }, 'Creating lease', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $user = $request->user();
            $lease = Lease::with('unit.property')->findOrFail($id);

            if ($user->id !== $lease->unit->property->owner_id) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $data = $request->validate([
                'status' => 'required|in:pending,active,terminated,expired',
            ]);

            $current = $lease->status;
            $new = $data['status'];

            if ($new === $current) {
                return response()->json(['message' => 'Lease is already in this status.'], 422);
            }

            $validTransitions = [
                'pending' => ['active', 'terminated'],
                'active' => ['terminated', 'expired'],
            ];

            if (!isset($validTransitions[$current]) || !in_array($new, $validTransitions[$current], true)) {
                return response()->json([
                    'message' => "Cannot change lease status from '{$current}' to '{$new}'."
                ], 403);
            }

            if (in_array($new, ['pending', 'active']) && $this->unitHasLeaseConflict($lease->unit_id, $lease->id)) {
                return response()->json([
                    'message' => 'Cannot reactivate: another active/pending lease exists on this unit.'
                ], 409);
            }

            if ($new === 'active') {
                $limit = $this->getEffectivePlan($user)?->allowed_units;
                $activeCount = Lease::whereIn('unit_id', $user->units()->pluck('units.id'))
                    ->where('status', 'active')
                    ->count();

                if ($limit !== null && $limit > 0 && $activeCount >= $limit) {
                    return response()->json(['message' => 'Unit limit exceeded under your current plan.'], 403);
                }

                $lease->unit->update(['is_available' => false]);
            }

            if (in_array($new, ['terminated', 'expired'])) {
                if ($this->canMarkUnitAvailable($lease->unit_id, $lease->id)) {
                    $lease->unit->update(['is_available' => true]);
                }
            }

            $lease->update(['status' => $new]);

            // event(new SignificantNotificationEvent(
            //     user_id: $lease->tenant_id,
            //     subject: 'Lease Status Updated',
            //     message: "Your lease at {$lease->unit->property->name} is now marked as '{$new}'."
            // ));

            return response()->json($lease);
        }, 'Updating lease status', [
            'user_id' => $request->user()->id,
            'lease_id' => $id,
            'input' => $request->all(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $user = $request->user();
            $lease = Lease::with('unit')->findOrFail($id);

            if ($user->id !== $lease->unit->property->owner_id) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $unitId = $lease->unit_id;
            $lease->delete();

            if ($this->canMarkUnitAvailable($unitId)) {
                Unit::find($unitId)->update(['is_available' => true]);
            }

            return response()->json(['message' => 'Lease deleted successfully.']);
        }, 'Deleting lease', [
            'user_id' => $request->user()->id,
            'lease_id' => $id,
        ]);
    }
}
