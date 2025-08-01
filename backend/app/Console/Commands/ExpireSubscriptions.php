<?php

namespace App\Console\Commands;

use App\Events\SignificantNotificationEvent;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire';
    protected $description = 'Expire subscriptions and send notifications';

    public function handle()
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $in3Days = $today->copy()->addDays(3);

        // === STEP 1: Send 3-day reminders ===
        $subscriptionsToRemind = Subscription::where('status', 'active')
            ->whereDate('ends_at', $in3Days)
            ->with('user')
            ->get();

        $reminderCount = 0;

        foreach ($subscriptionsToRemind as $subscription) {
            $user = $subscription->user;
            if (!$user)
                continue;

            $cacheKey = "notif:reminder:{$subscription->id}";
            if (!Cache::has($cacheKey)) {
                event(new SignificantNotificationEvent(
                    user_id: $user->id,
                    subject: 'Subscription Expiry Reminder',
                    message: "Hi {$user->first_name}, your subscription (ID: {$subscription->id}) will expire on {$subscription->ends_at->format('Y-m-d')}."
                ));
                Cache::put($cacheKey, true, now()->addDays(1)); // avoid duplicates
                $reminderCount++;
            }
        }

        // === STEP 2: Expire subscriptions and send expiration notification ===
        $subscriptionsToExpire = Subscription::where('status', 'active')
            ->where('ends_at', '<', $now)
            ->with('user')
            ->get();

        $expiredCount = 0;

        foreach ($subscriptionsToExpire as $subscription) {
            $subscription->update(['status' => 'expired']);
            $expiredCount++;

            $user = $subscription->user;
            if (!$user)
                continue;

            event(new SignificantNotificationEvent(
                user_id: $user->id,
                subject: 'Subscription Expired',
                message: "Hi {$user->first_name}, your subscription (ID: {$subscription->id}) expired on {$subscription->ends_at->format('Y-m-d')}."
            ));
        }

        // === Logging ===
        Log::info("Sent {$reminderCount} 3-day reminders.");
        Log::info("Expired {$expiredCount} subscriptions.");

        $this->info("Sent {$reminderCount} 3-day reminders.");
        $this->info("Expired {$expiredCount} subscriptions.");
    }
}
