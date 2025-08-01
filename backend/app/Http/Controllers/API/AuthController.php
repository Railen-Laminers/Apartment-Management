<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use App\Models\Plan;
use App\Models\Subscription;
use App\Traits\HandlesApiExceptions;
use App\Traits\HandlesUserProfile;
use App\Traits\PreventsDuplicates;
use App\Traits\HandlesPlans;

class AuthController extends Controller
{
    use HandlesApiExceptions, HandlesUserProfile, PreventsDuplicates, HandlesPlans;

    public function register(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'first_name' => 'required|string|max:50',
                'middle_name' => 'nullable|string|max:50',
                'last_name' => 'required|string|max:50',
                'email' => 'required|email|unique:users',
                'password' => ['required', 'confirmed', Password::min(8)],
                'contact_number' => 'nullable|string',
                'business_info' => 'nullable|string',
                'address' => 'nullable|string',
            ]);

            // ✅ Check for duplicate registration
            $model = new User();
            if ($this->isDuplicate($model, $request, ['email'])) {
                return response()->json(['message' => 'Duplicate registration detected.'], 409);
            }

            // ✅ Create user
            $user = User::create([
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'landlord',
                'contact_number' => $data['contact_number'] ?? null,
            ]);

            // ✅ Create landlord profile
            $user->landlordProfile()->create([
                'business_info' => $data['business_info'] ?? null,
                'address' => $data['address'] ?? null,
            ]);

            // ✅ Ensure a default free plan exists (or create one)
            $plan = $this->createFallbackDefaultPlanIfMissing();

            // ✅ Assign subscription to new user
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'started_at' => now(),
                'ends_at' => $plan->duration_days ? now()->addDays($plan->duration_days) : null,
            ]);

            // ✅ Issue token
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json(['user' => $user, 'token' => $token], 201);
        }, 'register');
    }


    public function registerTenant(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $authUser = $request->user();
            if ($authUser->role !== 'landlord') {
                return response()->json(['message' => 'Only landlords can register tenants.'], 403);
            }

            $data = $request->validate([
                'first_name' => 'required|string|max:50',
                'middle_name' => 'nullable|string|max:50',
                'last_name' => 'required|string|max:50',
                'email' => 'required|email|unique:users',
                'password' => ['required', 'confirmed', Password::min(8)],
                'contact_number' => 'nullable|string',
                'occupation' => 'nullable|string|max:100',
                'income' => 'nullable|numeric|min:0',
                'civil_status' => 'nullable|string|max:20',
                'dependents' => 'nullable|integer|min:0',
                'employer_info' => 'nullable|string',
                'valid_id' => 'nullable|string|max:100',
            ]);

            // Prevent duplicate tenant registration
            $model = new User();
            $isDuplicate = $this->isDuplicate($model, $request, ['email']);
            if ($isDuplicate) {
                return response()->json(['message' => 'Duplicate tenant registration detected.'], 409);
            }

            $tenant = User::create([
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'tenant',
                'contact_number' => $data['contact_number'] ?? null,
            ]);

            $tenant->tenantProfile()->create([
                'landlord_id' => $authUser->id,
                'occupation' => $data['occupation'] ?? null,
                'income' => $data['income'] ?? null,
                'civil_status' => $data['civil_status'] ?? null,
                'dependents' => $data['dependents'] ?? 0,
                'employer_info' => $data['employer_info'] ?? null,
                'valid_id' => $data['valid_id'] ?? null,
            ]);

            return response()->json(['message' => 'Tenant registered successfully.', 'tenant' => $tenant], 201);
        }, 'registerTenant', ['user_id' => $request->user()->id]);
    }


    public function login(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $user = User::where('email', $credentials['email'])->first();

            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            $token = $user->createToken('api-token')->plainTextToken;
            return response()->json(['user' => $user, 'token' => $token]);
        }, 'login');
    }

    public function logout(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Logged out'], 200);
        }, 'logout', ['user_id' => $request->user()->id]);
    }

    public function me(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $user = $request->user()->loadMissing([
                'landlordProfile',
                'tenantProfile.landlord.landlordProfile',
            ]);
            
            $planInfo = $this->getUserPlanDetails($user);
            $plan = $planInfo['plan'];

            $response = [
                'user' => $user->makeHidden('profile_image')->append('profile_image_url'),
                'plan' => $plan ? [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'channels' => $planInfo['channels'],
                    'is_paid' => $planInfo['is_paid'],
                    'duration_days' => $plan->duration_days,
                    'allowed_properties' => $plan->allowed_properties,
                    'allowed_units' => $plan->allowed_units,
                ] : [
                    'id' => null,
                    'name' => 'All Access',
                    'channels' => $planInfo['channels'],
                    'is_paid' => true,
                    'duration_days' => null,
                    'allowed_properties' => null,
                    'allowed_units' => null,
                ],
            ];

            if ($user->role === 'landlord') {
                $response['profile'] = $user->landlordProfile;
            } elseif ($user->role === 'tenant') {
                $response['profile'] = $user->tenantProfile;
                $response['landlord_profile'] = $user->tenantProfile?->landlord?->landlordProfile;
            } else {
                $response['profile'] = null;
            }

            return response()->json($response);
        }, 'me', ['user_id' => $request->user()?->id]);
    }

    public function updateProfile(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $user = $request->user();
            $planInfo = $this->getUserPlanDetails($user);
            $channels = $planInfo['channels'];

            $data = $request->validate([
                'first_name' => 'sometimes|required|string|max:50',
                'middle_name' => 'nullable|string|max:50',
                'last_name' => 'sometimes|required|string|max:50',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'contact_number' => 'nullable|string|max:20',
                'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'telegram_id' => 'nullable|string|max:100',
                'messenger_psid' => 'nullable|string|max:100',
                'messenger_link' => 'nullable|string|max:255',
                'current_password' => 'nullable|string',
                'new_password' => ['nullable', 'string', 'min:8'],
                'confirm_password' => 'nullable|string|same:new_password',

                // Landlord profile
                'business_info' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'payment_methods' => 'nullable|array',

                // Tenant profile
                'occupation' => 'nullable|string|max:100',
                'income' => 'nullable|numeric|min:0',
                'civil_status' => 'nullable|string|max:20',
                'dependents' => 'nullable|integer|min:0',
                'employer_info' => 'nullable|string|max:255',
                'valid_id' => 'nullable|string|max:100',
            ]);

            $data['profile_image'] = $this->handleProfileImageUpload($user, $request->file('profile_image'));

            $pwCheck = $this->handlePasswordUpdate($user, $data);
            if (isset($pwCheck['error'])) {
                return response()->json(['message' => $pwCheck['error']], 403);
            }

            $user->update([
                'first_name' => $data['first_name'] ?? $user->first_name,
                'middle_name' => $data['middle_name'] ?? $user->middle_name,
                'last_name' => $data['last_name'] ?? $user->last_name,
                'email' => $data['email'] ?? $user->email,
                'contact_number' => $data['contact_number'] ?? $user->contact_number,
                'profile_image' => $data['profile_image'] ?? $user->profile_image,
                'telegram_id' => in_array('telegram', $channels) ? ($data['telegram_id'] ?? null) : null,
                'messenger_psid' => in_array('messenger', $channels) ? ($data['messenger_psid'] ?? null) : null,
                'messenger_link' => in_array('messenger', $channels) ? ($data['messenger_link'] ?? null) : null,
            ]);

            if ($user->role === 'landlord' && $user->landlordProfile) {
                $this->updateLandlordProfile($user, $data);
            }

            if ($user->role === 'tenant' && $user->tenantProfile) {
                $this->updateTenantProfile($user, $data);
            }

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user->loadMissing(['landlordProfile', 'tenantProfile'])->append('profile_image_url'),
            ]);
        }, 'updateProfile', ['user_id' => $request->user()?->id]);
    }
}
