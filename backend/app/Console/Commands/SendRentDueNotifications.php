<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\Lease;
use App\Events\SignificantNotificationEvent;

class SendRentDueNotifications extends Command
{
    protected $signature = 'notify:rent-due';
    protected $description = 'Send rent due notifications 3 days before, on the due date, and late after grace period.';

    public function handle()
    {
        $today = Carbon::today();
        $dayToday = $today->day;
        $dayIn3Days = $today->copy()->addDays(3)->day;

        $this->info("Looking for leases with rent due today ({$dayToday}), in 3 days ({$dayIn3Days}), or overdue...");

        $leases = Lease::with(['unit.property', 'tenant'])
            ->where('status', 'active')
            ->get();

        $notifCount = 0;
        $lateCount = 0;

        foreach ($leases as $lease) {
            $terms = $lease->contract_terms;
            $dueDay = (int) ($terms['rent_due_day'] ?? null);
            $graceDays = (int) ($terms['grace_period_days'] ?? 0);
            if (!$dueDay || !$lease->tenant || !$lease->unit) {
                continue;
            }

            $tenant = $lease->tenant;
            $unit = $lease->unit;
            $propertyName = $unit->property->name ?? 'your unit';

            // Determine rent due date for this month
            $dueDate = Carbon::today()->startOfMonth()->addDays($dueDay - 1);
            $graceDeadline = $dueDate->copy()->addDays($graceDays);

            // Cache keys
            $cacheBase = "notif:rent_due:{$lease->id}";
            $alreadyLate = Cache::has("$cacheBase:late");
            $alreadyToday = Cache::has("$cacheBase:today");
            $alreadyIn3 = Cache::has("$cacheBase:in3");

            // 1. Rent is due today
            if ($dueDate->isSameDay($today) && !$alreadyToday) {
                $message = "📅 Reminder: Your rent for {$propertyName} is due **today** ({$today->toFormattedDateString()}). Please make your payment promptly.";
                event(new SignificantNotificationEvent(
                    user_id: $tenant->id,
                    subject: 'Rent Due Today',
                    message: $message
                ));
                Cache::put("$cacheBase:today", true, now()->addHours(12));
                $notifCount++;
                continue;
            }

            // 2. Rent is due in 3 days
            if ($dueDate->isSameDay($today->copy()->addDays(3)) && !$alreadyIn3) {
                $message = "⏳ Heads up! Your rent for {$propertyName} is due in 3 days (on the {$this->ordinal($dueDay)}). Kindly prepare your payment.";
                event(new SignificantNotificationEvent(
                    user_id: $tenant->id,
                    subject: 'Upcoming Rent Due',
                    message: $message
                ));
                Cache::put("$cacheBase:in3", true, now()->addHours(12));
                $notifCount++;
                continue;
            }

            // 3. Rent is overdue (grace period passed)
            if ($today->gt($graceDeadline) && !$alreadyLate) {
                $message = "⚠️ Overdue Notice: Your rent for {$propertyName} was due on {$dueDate->toFormattedDateString()} and the {$graceDays}-day grace period has ended. Please settle immediately.";
                event(new SignificantNotificationEvent(
                    user_id: $tenant->id,
                    subject: 'Late Rent Payment',
                    message: $message
                ));
                Cache::put("$cacheBase:late", true, now()->addDay());
                $lateCount++;
            }
        }

        $this->info("✅ Rent due notifications sent: {$notifCount}");
        $this->info("⚠️ Late rent notifications sent: {$lateCount}");
        return 0;
    }

    protected function ordinal($number)
    {
        $suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
        if (($number % 100) >= 11 && ($number % 100) <= 13) {
            return $number . 'th';
        }
        return $number . $suffixes[$number % 10];
    }
}
