<?php

namespace App\Listeners;

use App\Events\SignificantNotificationEvent;
use App\Mail\GenericNotification;
use App\Models\Notification;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class DispatchMultiChannelNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SignificantNotificationEvent $event): void
    {
        $user = User::find($event->user_id);
        if (!$user)
            return;

        $subject = $event->subject;
        $message = $event->message;
        $messageHash = sha1($subject . $message); // To uniquely identify this message
        $channels = $this->getAllowedChannels($user);

        // === EMAIL ===
        if (in_array('email', $channels) && !empty($user->email)) {
            $cacheKey = "notif:email:{$user->id}:{$messageHash}";
            if (!Cache::has($cacheKey)) {
                try {
                    Mail::to($user->email)->send(new GenericNotification($subject, $message));

                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'email',
                        'event' => class_basename($event),
                        'payload' => ['subject' => $subject, 'message' => $message],
                        'status' => 'sent',
                        'attempts' => 1,
                        'sent_at' => Carbon::now(),
                    ]);
                } catch (\Throwable $e) {
                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'email',
                        'event' => class_basename($event),
                        'payload' => ['message' => $message, 'error' => $e->getMessage()],
                        'status' => 'failed',
                        'attempts' => 1,
                    ]);
                }

                Cache::put($cacheKey, true, now()->addMinutes(5));
            }
        }

        // === TELEGRAM ===
        if (in_array('telegram', $channels) && !empty($user->telegram_id)) {
            $cacheKey = "notif:telegram:{$user->id}:{$messageHash}";
            if (!Cache::has($cacheKey)) {
                try {
                    Http::post("https://api.telegram.org/bot" . config('services.telegram.bot_token') . "/sendMessage", [
                        'chat_id' => $user->telegram_id,
                        'text' => $message,
                    ]);

                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'telegram',
                        'event' => class_basename($event),
                        'payload' => ['message' => $message],
                        'status' => 'sent',
                        'attempts' => 1,
                        'sent_at' => Carbon::now(),
                    ]);
                } catch (\Throwable $e) {
                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'telegram',
                        'event' => class_basename($event),
                        'payload' => ['message' => $message, 'error' => $e->getMessage()],
                        'status' => 'failed',
                        'attempts' => 1,
                    ]);
                }

                Cache::put($cacheKey, true, now()->addMinutes(5));
            }
        }

        // === MESSENGER ===
        if (in_array('messenger', $channels) && !empty($user->messenger_psid)) {
            $cacheKey = "notif:messenger:{$user->id}:{$messageHash}";
            if (!Cache::has($cacheKey)) {
                try {
                    Http::post("https://graph.facebook.com/v18.0/me/messages", [
                        'recipient' => ['id' => $user->messenger_psid],
                        'message' => ['text' => $message],
                        'messaging_type' => 'UPDATE',
                        'access_token' => config('services.facebook.page_token'),
                    ]);

                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'messenger',
                        'event' => class_basename($event),
                        'payload' => ['message' => $message],
                        'status' => 'sent',
                        'attempts' => 1,
                        'sent_at' => Carbon::now(),
                    ]);
                } catch (\Throwable $e) {
                    Notification::create([
                        'user_id' => $user->id,
                        'channel' => 'messenger',
                        'event' => class_basename($event),
                        'payload' => ['message' => $message, 'error' => $e->getMessage()],
                        'status' => 'failed',
                        'attempts' => 1,
                    ]);
                }

                Cache::put($cacheKey, true, now()->addMinutes(5));
            }
        }
    }

    /**
     * Determine allowed notification channels based on user and plan.
     */
    protected function getAllowedChannels(User $user): array
    {
        if ($user->role === 'admin') {
            return ['email', 'telegram', 'messenger'];
        }

        if ($user->role === 'landlord') {
            $subscription = $user->subscriptions()
                ->where('status', 'active')
                ->whereHas('plan', fn($q) => $q->where('is_default', false))
                ->with('plan')
                ->first();

            $plan = $subscription?->plan ?? Plan::where('is_default', true)->where('is_active', true)->first();
            return json_decode($plan->enable_notifications ?? '[]', true);
        }

        if ($user->role === 'tenant') {
            $landlord = $user->tenantProfile?->landlord;
            if (!$landlord)
                return [];

            $subscription = $landlord->subscriptions()
                ->where('status', 'active')
                ->whereHas('plan', fn($q) => $q->where('is_default', false))
                ->with('plan')
                ->first();

            $plan = $subscription?->plan ?? Plan::where('is_default', true)->where('is_active', true)->first();
            return json_decode($plan->enable_notifications ?? '[]', true);
        }

        return [];
    }
}
