<?php

namespace App\Console\Commands;

use App\Events\SignificantNotificationEvent;
use App\Models\Lease;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ExpireLeases extends Command
{
    protected $signature = 'leases:expire';
    protected $description = 'Expire leases, notify tenants, and mark units available.';

    public function handle(): void
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $in3Days = $today->copy()->addDays(3);

        $reminderCount = 0;
        $expiredCount = 0;

        // === Step 1: Send 3-day reminder to tenants
        $leasesToRemind = Lease::where('status', 'active')
            ->whereDate('end_date', $in3Days)
            ->with('tenant')
            ->get();

        foreach ($leasesToRemind as $lease) {
            $tenant = $lease->tenant;
            if (!$tenant)
                continue;

            $cacheKey = "notif:lease:reminder:{$lease->id}";
            if (!Cache::has($cacheKey)) {
                event(new SignificantNotificationEvent(
                    user_id: $tenant->id,
                    subject: 'Lease Expiry Reminder',
                    message: "Hi {$tenant->first_name}, your lease (ID: {$lease->id}) will expire on {$lease->end_date->format('Y-m-d')}."
                ));
                Cache::put($cacheKey, true, now()->addDay()); // prevent duplicate within 24h
                $reminderCount++;
            }
        }

        // === Step 2: Expire past-due leases and mark unit available
        $leasesToExpire = Lease::where('status', 'active')
            ->whereDate('end_date', '<', $today)
            ->with(['tenant', 'unit'])
            ->get();

        foreach ($leasesToExpire as $lease) {
            $lease->update(['status' => 'expired']);
            $expiredCount++;

            // Make unit available again
            if ($lease->unit) {
                $lease->unit->update(['is_available' => true]);
            }

            // Notify tenant
            $tenant = $lease->tenant;
            if ($tenant) {
                event(new SignificantNotificationEvent(
                    user_id: $tenant->id,
                    subject: 'Lease Expired',
                    message: "Hi {$tenant->first_name}, your lease (ID: {$lease->id}) expired on {$lease->end_date->format('Y-m-d')} and the unit is now available again."
                ));
            }
        }

        Log::info("Lease expiration job: {$reminderCount} reminder(s) sent, {$expiredCount} lease(s) expired.");
        $this->info("Lease reminders sent: {$reminderCount}");
        $this->info("Leases marked expired: {$expiredCount}");
    }
}
