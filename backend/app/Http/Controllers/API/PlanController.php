<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;
use App\Traits\HandlesPlans;

class PlanController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates, HandlesPlans;

    // Public: List all active plans (with fallback free plan if none exist)
    public function index()
    {
        return $this->safeCall(function () {
            // Check if there are any active plans
            $activePlans = Plan::where('is_active', true)->get();

            // If no plans exist, auto-create a fallback free plan
            if ($activePlans->isEmpty()) {
                $fallbackPlan = $this->createFallbackDefaultPlanIfMissing();
                $activePlans = collect([$fallbackPlan]);
            }

            return response()->json($activePlans);
        }, 'Listing active plans');
    }


    // Admin: List all plans
    public function all()
    {
        return $this->safeCall(fn() => response()->json(
            Plan::all()
        ), 'Listing all plans');
    }

    // Admin: Create new plan
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'allowed_properties' => 'nullable|integer|min:0',
                'allowed_units' => 'nullable|integer|min:0',
                'enable_notifications' => 'nullable|array',
                'price' => 'required|numeric|min:0',
                'duration_days' => 'nullable|integer|min:1',
                'is_default' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($this->isDuplicate(new Plan(), $request, ['name'])) {
                return response()->json(['message' => 'A plan with the same name already exists.'], 409);
            }

            // Only free plan can be default, and there should be only one default
            if ($response = $this->enforceDefaultPlan($validated)) {
                return $response;
            }

            if (isset($validated['enable_notifications'])) {
                $validated['enable_notifications'] = json_encode($validated['enable_notifications']);
            }

            $plan = Plan::create($validated);
            return response()->json($plan, 201);
        }, 'Creating plan', [
            'request_data' => $request->all(),
        ]);
    }

    // Admin: Show plan
    public function show($id)
    {
        return $this->safeCall(fn() => response()->json(
            Plan::findOrFail($id)
        ), "Retrieving plan", ['plan_id' => $id]);
    }

    // Admin: Update plan
    public function update(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $plan = Plan::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'allowed_properties' => 'nullable|integer|min:0',
                'allowed_units' => 'nullable|integer|min:0',
                'enable_notifications' => 'nullable|array',
                'price' => 'numeric|min:0',
                'duration_days' => 'nullable|integer|min:1',
                'is_default' => 'boolean',
                'is_active' => 'boolean',
            ]);

            // Only free plan can be default, and enforce uniqueness
            if ($response = $this->enforceDefaultPlan($validated, $plan->id)) {
                return $response;
            }

            if (isset($validated['enable_notifications'])) {
                $validated['enable_notifications'] = json_encode($validated['enable_notifications']);
            }

            $plan->update($validated);
            return response()->json($plan);
        }, "Updating plan", [
            'plan_id' => $id,
            'request_data' => $request->all(),
        ]);
    }

    // Admin: Delete plan
    public function destroy($id)
    {
        return $this->safeCall(function () use ($id) {
            $plan = Plan::findOrFail($id);

            // Prevent deletion if plan is used in subscriptions
            if ($plan->subscriptions()->exists()) {
                return response()->json([
                    'message' => 'This plan cannot be deleted because it is currently used in one or more subscriptions.'
                ], 409);
            }

            $plan->delete();

            return response()->json(['message' => 'Plan deleted successfully.']);
        }, "Deleting plan", ['plan_id' => $id]);
    }

}
