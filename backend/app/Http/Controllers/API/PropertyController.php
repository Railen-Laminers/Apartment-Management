<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Traits\HandlesPlanFeatures;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;

class PropertyController extends Controller
{
    use HandlesPlanFeatures, HandlesApiExceptions, PreventsDuplicates;

    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $properties = $user->properties()->withCount('units')->get();
            $allowedIds = $this->getEditableIds($user, 'properties', $plan?->allowed_properties);

            $properties->transform(fn($p) => tap($p->append('image_url'), fn($x) => $x->editable = in_array($x->id, $allowedIds)));

            return response()->json([
                'properties' => $properties,
                'limits' => [
                    'max_properties' => $plan?->allowed_properties,
                    'current_properties' => $properties->count(),
                ],
            ]);
        }, 'Listing properties', ['user_id' => $request->user()->id]);
    }

    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'name' => 'required|string|max:100',
                'address' => 'required|string',
                'image' => 'nullable|image|max:2048',
            ]);

            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $currentCount = $user->properties()->count();

            if ($plan && $plan->allowed_properties !== null && $currentCount >= $plan->allowed_properties) {
                return response()->json(['message' => 'Property limit reached for your plan.'], 403);
            }

            $propertyModel = $user->properties()->getModel();
            $isDuplicate = $this->isDuplicate($propertyModel, $request, ['name', 'address'], ['owner_id' => $user->id]);

            if ($isDuplicate) {
                return response()->json(['message' => 'Duplicate property detected.'], 409);
            }

            if ($request->hasFile('image')) {
                $filename = time() . '_' . $request->file('image')->getClientOriginalName();
                $data['image'] = $request->file('image')->storeAs('properties', $filename, 'public');
            }

            $property = $user->properties()->create($data);

            return response()->json($property->append('image_url'), 201);
        }, 'Creating property', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    public function show(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $property = $request->user()
                ->properties()
                ->with('units')
                ->findOrFail($id)
                ->append('image_url');

            return response()->json($property);
        }, 'Showing property', ['property_id' => $id]);
    }

    public function update(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $data = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'address' => 'sometimes|required|string',
                'image' => 'nullable|image|max:2048',
            ]);

            $user = $request->user();
            $plan = $this->getEffectivePlan($user);
            $allowedIds = $this->getEditableIds($user, 'properties', $plan?->allowed_properties);

            if (!in_array((int) $id, $allowedIds)) {
                return response()->json(['message' => 'You cannot edit this property under your current plan.'], 403);
            }

            $property = $user->properties()->findOrFail($id);

            // ✅ FIX: Use correct column name (owner_id)
            $propertyModel = $user->properties()->getModel();
            $isDuplicate = $this->isDuplicate(
                $propertyModel,
                $request,
                ['name', 'address'],
                ['owner_id' => $user->id],
                $excludeId = $property->id
            );

            if ($isDuplicate) {
                return response()->json(['message' => 'Duplicate property detected.'], 409);
            }

            if ($request->hasFile('image')) {
                if ($property->image && Storage::disk('public')->exists($property->image)) {
                    Storage::disk('public')->delete($property->image);
                }

                $filename = time() . '_' . $request->file('image')->getClientOriginalName();
                $data['image'] = $request->file('image')->storeAs('properties', $filename, 'public');
            }

            $property->update($data);

            return response()->json($property->append('image_url'));
        }, 'Updating property', [
            'property_id' => $id,
            'request_data' => $request->all(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $property = $request->user()->properties()->findOrFail($id);

            if ($property->image && Storage::disk('public')->exists($property->image)) {
                Storage::disk('public')->delete($property->image);
            }

            $property->delete();

            return response()->json(['message' => 'Deleted']);
        }, 'Deleting property', ['property_id' => $id]);
    }
}
