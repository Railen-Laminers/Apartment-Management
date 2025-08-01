<?php

namespace App\Traits;

use App\Models\Plan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait HandlesUserProfile
{
    /**
     * Gets the user's plan, notification channels, and whether it's paid.
     */
    protected function getUserPlanDetails($user)
    {
        try {
            if ($user->role === 'admin') {
                return ['plan' => null, 'channels' => ['email', 'telegram', 'messenger'], 'is_paid' => true];
            }

            $refUser = $user->role === 'tenant' ? $user->tenantProfile?->landlord : $user;

            if (!$refUser) {
                return ['plan' => null, 'channels' => [], 'is_paid' => false];
            }

            $subscription = $refUser->subscriptions()
                ->where('status', 'active')
                ->whereHas('plan', fn($q) => $q->where('is_default', false))
                ->with('plan')
                ->first();

            $plan = $subscription?->plan ?? Plan::where('is_default', true)->where('is_active', true)->first();

            return [
                'plan' => $plan,
                'channels' => json_decode($plan->enable_notifications ?? '[]', true),
                'is_paid' => (bool) $subscription,
            ];
        } catch (\Throwable $e) {
            Log::error('getUserPlanDetails error', ['error' => $e->getMessage()]);
            return ['plan' => null, 'channels' => [], 'is_paid' => false];
        }
    }

    /**
     * Handles profile image upload and deletion of old image.
     */
    protected function handleProfileImageUpload($user, $file)
    {
        if (!$file)
            return $user->profile_image;

        // Delete previous image if it exists
        if ($user->profile_image && Storage::disk('public')->exists(str_replace('storage/', '', $user->profile_image))) {
            Storage::disk('public')->delete(str_replace('storage/', '', $user->profile_image));
        }

        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('profile_images', $filename, 'public');
        return 'storage/' . $path;
    }

    /**
     * Validates and updates user password securely.
     */
    protected function handlePasswordUpdate($user, $data)
    {
        if (!empty($data['current_password']) || !empty($data['new_password'])) {
            if (
                empty($data['current_password']) ||
                empty($data['new_password']) ||
                empty($data['confirm_password'])
            ) {
                return ['error' => 'All password fields are required.'];
            }

            if (!Hash::check($data['current_password'], $user->password)) {
                return ['error' => 'Current password is incorrect.'];
            }

            $user->update(['password' => Hash::make($data['new_password'])]);
        }

        return ['success' => true];
    }

    /**
     * Updates the landlord's profile information.
     */
    protected function updateLandlordProfile($user, $data)
    {
        $user->landlordProfile()->update([
            'business_info' => $data['business_info'] ?? $user->landlordProfile?->business_info,
            'address' => $data['address'] ?? $user->landlordProfile?->address,
            'payment_methods' => $data['payment_methods'] ?? $user->landlordProfile?->payment_methods,
        ]);
    }

    /**
     * Updates the tenant's profile information.
     */
    protected function updateTenantProfile($user, $data)
    {
        $user->tenantProfile()->update([
            'occupation' => $data['occupation'] ?? $user->tenantProfile?->occupation,
            'income' => $data['income'] ?? $user->tenantProfile?->income,
            'civil_status' => $data['civil_status'] ?? $user->tenantProfile?->civil_status,
            'dependents' => $data['dependents'] ?? $user->tenantProfile?->dependents,
            'employer_info' => $data['employer_info'] ?? $user->tenantProfile?->employer_info,
            'valid_id' => $data['valid_id'] ?? $user->tenantProfile?->valid_id,
        ]);
    }
}
