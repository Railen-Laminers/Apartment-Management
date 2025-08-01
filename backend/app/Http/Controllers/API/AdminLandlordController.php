<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use App\Traits\HandlesApiExceptions;

class AdminLandlordController extends Controller
{
    use HandlesApiExceptions;

    /**
     * List all landlords with their profiles.
     */
    public function index(): JsonResponse
    {
        return $this->safeCall(function () {
            $landlords = User::with([
                'landlordProfile',
                'subscriptions.plan' // ✅ Add this line to load plan name and is_default
            ])
                ->where('role', 'landlord')
                ->get();

            return response()->json($landlords);
        }, 'Fetching landlords list');
    }


    /**
     * Show details of a single landlord.
     */
    public function show($id): JsonResponse
    {
        return $this->safeCall(function () use ($id) {
            $landlord = User::with([
                'landlordProfile',
                'subscriptions.plan',
                'properties.units.leases.tenant.tenantProfile',
                'tenants.user.tenantProfile',
            ])
                ->where('role', 'landlord')
                ->findOrFail($id);

            return response()->json($landlord);
        }, "Fetching landlord details", ['landlord_id' => $id]);
    }
}
