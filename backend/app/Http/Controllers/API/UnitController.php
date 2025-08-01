<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Unit;
use App\Traits\HandlesPlanFeatures;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;
use App\Traits\ChecksLeaseConflicts;

class UnitController extends Controller
{
    use HandlesPlanFeatures, HandlesApiExceptions, PreventsDuplicates, ChecksLeaseConflicts;

    /**
     * List all units under a property, and mark which ones are editable.
     */
    public function index(Request $request, $propertyId)
    {
        return $this->safeCall(function () use ($request, $propertyId) {
            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $property = $user->properties()->findOrFail($propertyId);

            // Determine if the property is editable
            $allowedPropertyIds = $this->getEditableIds($user, 'properties', $plan?->allowed_properties);
            $property->editable = in_array($property->id, $allowedPropertyIds);

            // Retrieve units under the property
            $units = $property->units()->get();

            // Get editable unit IDs under the unit limit per property
            $allowedUnitIds = $this->getEditableUnitIdsForProperty($property, $plan?->allowed_units);

            // ✅ Fix: Only mark units editable if both the unit and its parent property are editable
            $units = $units->map(function ($unit) use ($allowedUnitIds, $property) {
                $unit->editable = $property->editable && in_array($unit->id, $allowedUnitIds);
                return $unit;
            });

            return response()->json([
                'property' => $property,
                'units' => $units,
                'limits' => [
                    'current' => $property->units()->count(),
                    'max' => $plan?->allowed_units,
                ],
            ]);
        }, 'Fetching units under property', [
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
        ]);
    }

    /**
     * Create a new unit in a property.
     */
    public function store(Request $request, $propertyId)
    {
        return $this->safeCall(function () use ($request, $propertyId) {
            $validated = $request->validate([
                'unit_number' => 'required|string|max:50',
                'rent_amount' => 'required|numeric|min:0',
                'unit_type' => 'required|string',
                'floor' => 'nullable|integer',
                'square_meters' => 'nullable|integer',
                'is_available' => 'required|boolean',
            ]);

            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $property = $user->properties()->findOrFail($propertyId);

            // Make sure property is within editable list
            $allowedPropertyIds = $this->getEditableIds($user, 'properties', $plan?->allowed_properties);
            if (!in_array($property->id, $allowedPropertyIds)) {
                return response()->json(['message' => 'You cannot add units to this property under your current plan.'], 403);
            }

            // Enforce unit limit
            $currentUnitCount = $property->units()->count();
            $limit = $plan?->allowed_units;
            if ($limit !== null && $currentUnitCount >= $limit) {
                return response()->json(['message' => 'Unit limit reached for this property under your plan.'], 403);
            }

            // Check for duplicate unit number
            if ($this->isDuplicate($property->units()->getModel(), $request, ['unit_number'], ['property_id' => $property->id])) {
                return response()->json(['message' => 'Duplicate unit number in this property.'], 409);
            }

            $unit = $property->units()->create($validated);

            return response()->json($unit, 201);
        }, 'Creating unit', [
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
            'input' => $request->all(),
        ]);
    }

    /**
     * Show a specific unit.
     */
    public function show(Request $request, $propertyId, $id)
    {
        return $this->safeCall(function () use ($request, $propertyId, $id) {
            $property = $request->user()->properties()->findOrFail($propertyId);
            $unit = $property->units()->findOrFail($id);
            return response()->json($unit);
        }, 'Showing unit', [
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
            'unit_id' => $id,
        ]);
    }

    /**
     * Update a unit, only if it's within the allowed editable unit list and the property is editable.
     */
    public function update(Request $request, $propertyId, $id)
    {
        return $this->safeCall(function () use ($request, $propertyId, $id) {
            $validated = $request->validate([
                'unit_number' => 'sometimes|required|string|max:50',
                'rent_amount' => 'sometimes|required|numeric|min:0',
                'unit_type' => 'sometimes|required|string',
                'floor' => 'nullable|integer',
                'square_meters' => 'nullable|integer',
                'is_available' => 'required|boolean',
            ]);

            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $property = $user->properties()->findOrFail($propertyId);

            // Check if property is editable
            $allowedPropertyIds = $this->getEditableIds($user, 'properties', $plan?->allowed_properties);
            if (!in_array($property->id, $allowedPropertyIds)) {
                return response()->json(['message' => 'You cannot edit units under this property with your current plan.'], 403);
            }

            // Check if unit is editable
            $allowedUnitIds = $this->getEditableUnitIdsForProperty($property, $plan?->allowed_units);
            if (!in_array((int) $id, $allowedUnitIds)) {
                return response()->json(['message' => 'You cannot edit this unit under your current plan.'], 403);
            }

            $unit = $property->units()->findOrFail($id);

            // Check for duplicate unit number
            if (
                $this->isDuplicate(
                    $property->units()->getModel(),
                    $request,
                    ['unit_number'],
                    ['property_id' => $property->id],
                    $unit->id
                )
            ) {
                return response()->json(['message' => 'Another unit with this number already exists in this property.'], 409);
            }

            // Check lease conflict if trying to mark available
            if (
                $validated['is_available'] &&
                $this->unitHasLeaseConflict($unit->id)
            ) {
                return response()->json([
                    'message' => 'Cannot mark unit as available because it has an active or pending lease.',
                ], 409);
            }

            $unit->update($validated);

            return response()->json($unit);
        }, 'Updating unit', [
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
            'unit_id' => $id,
            'input' => $request->all(),
        ]);
    }

    /**
     * Delete a unit.
     */
    public function destroy(Request $request, $propertyId, $id)
    {
        return $this->safeCall(function () use ($request, $propertyId, $id) {
            $property = $request->user()->properties()->findOrFail($propertyId);
            $unit = $property->units()->findOrFail($id);
            $unit->delete();

            return response()->json(['message' => 'Deleted'], 200);
        }, 'Deleting unit', [
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
            'unit_id' => $id,
        ]);
    }
}
