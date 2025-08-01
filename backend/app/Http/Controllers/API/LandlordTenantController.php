<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Traits\HandlesApiExceptions;

class LandlordTenantController extends Controller
{
    use HandlesApiExceptions;

    // ✅ List all tenants of this landlord
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $landlordId = $request->user()->id;

            $tenants = User::with('tenantProfile')
                ->where('role', 'tenant')
                ->whereHas('tenantProfile', fn($q) => $q->where('landlord_id', $landlordId))
                ->get()
                ->map(fn($user) => tap(
                    array_merge($user->toArray(), ['tenantProfile' => $user->tenantProfile]),
                    fn(&$data) => $data
                ));

            return response()->json($tenants);
        }, 'Listing tenants', [
            'user_id' => $request->user()->id,
        ]);
    }

    // ✅ Show specific tenant
    public function show(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $landlordId = $request->user()->id;

            $tenant = User::with('tenantProfile')
                ->where('role', 'tenant')
                ->where('id', $id)
                ->whereHas('tenantProfile', fn($q) => $q->where('landlord_id', $landlordId))
                ->firstOrFail();

            $data = $tenant->toArray();
            $data['tenantProfile'] = $tenant->tenantProfile;

            return response()->json($data);
        }, "Fetching tenant", [
            'user_id' => $request->user()->id,
            'tenant_id' => $id,
        ]);
    }

    // ✅ Update a tenant
    public function update(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $landlordId = $request->user()->id;

            $tenant = User::where('role', 'tenant')
                ->where('id', $id)
                ->whereHas('tenantProfile', fn($q) => $q->where('landlord_id', $landlordId))
                ->firstOrFail();

            $data = $request->validate([
                'first_name' => 'required|string|max:50',
                'middle_name' => 'nullable|string|max:50',
                'last_name' => 'required|string|max:50',
                'email' => 'required|email|unique:users,email,' . $tenant->id,
                'contact_number' => 'nullable|string|max:20',
                'password' => ['nullable', 'confirmed', Password::min(8)],
                'profile_image' => 'nullable|string|max:255',
                'telegram_id' => 'nullable|string|max:100',
                'messenger_psid' => 'nullable|string|max:100',
                'messenger_link' => 'nullable|string|max:255',
                'occupation' => 'nullable|string|max:100',
                'income' => 'nullable|numeric|min:0',
                'civil_status' => 'nullable|string|max:20',
                'dependents' => 'nullable|integer|min:0',
                'employer_info' => 'nullable|string|max:255',
                'valid_id' => 'nullable|string|max:100',
            ]);

            $tenant->update([
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? $tenant->middle_name,
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'contact_number' => $data['contact_number'] ?? $tenant->contact_number,
                'profile_image' => $data['profile_image'] ?? $tenant->profile_image,
                'telegram_id' => $data['telegram_id'] ?? $tenant->telegram_id,
                'messenger_psid' => $data['messenger_psid'] ?? $tenant->messenger_psid,
                'messenger_link' => $data['messenger_link'] ?? $tenant->messenger_link,
                'password' => !empty($data['password'])
                    ? Hash::make($data['password'])
                    : $tenant->password,
            ]);

            $tenant->tenantProfile()->update([
                'occupation' => $data['occupation'] ?? $tenant->tenantProfile->occupation,
                'income' => $data['income'] ?? $tenant->tenantProfile->income,
                'civil_status' => $data['civil_status'] ?? $tenant->tenantProfile->civil_status,
                'dependents' => $data['dependents'] ?? $tenant->tenantProfile->dependents,
                'employer_info' => $data['employer_info'] ?? $tenant->tenantProfile->employer_info,
                'valid_id' => $data['valid_id'] ?? $tenant->tenantProfile->valid_id,
            ]);

            return response()->json([
                'message' => 'Tenant updated successfully.',
                'tenant' => $tenant->load('tenantProfile'),
            ]);
        }, "Updating tenant", [
            'user_id' => $request->user()->id,
            'tenant_id' => $id,
            'input' => $request->all(),
        ]);
    }

    // ✅ Delete a tenant
    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $landlordId = $request->user()->id;

            $tenant = User::where('role', 'tenant')
                ->where('id', $id)
                ->whereHas('tenantProfile', fn($q) => $q->where('landlord_id', $landlordId))
                ->firstOrFail();

            $tenant->tenantProfile()->delete();
            $tenant->delete();

            return response()->json(['message' => 'Tenant deleted successfully.']);
        }, "Deleting tenant", [
            'user_id' => $request->user()->id,
            'tenant_id' => $id,
        ]);
    }
}
