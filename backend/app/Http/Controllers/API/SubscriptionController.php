<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Storage;
use App\Traits\HandlesApiExceptions;
use App\Traits\HandlesSubscriptions;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    use HandlesApiExceptions, HandlesSubscriptions;

    // View user subscriptions with virtual free plan fallback
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $user = $request->user();
            $subs = $user->subscriptions()->with('plan')->get();

            $hasPaidActive = $subs->where('status', 'active')
                ->where('plan.is_default', false)
                ->isNotEmpty();

            if (!$hasPaidActive) {
                $freePlan = $this->getDefaultFreePlan();

                if ($freePlan && $subs->where('plan_id', $freePlan->id)->isEmpty()) {
                    $freeSub = Subscription::create([
                        'user_id' => $user->id,
                        'plan_id' => $freePlan->id,
                        'status' => 'active',
                        'started_at' => now(),
                        'ends_at' => null,
                    ]);
                    $freeSub->setRelation('plan', $freePlan); // optional
                    $subs->push($freeSub);
                }
            }


            return response()->json($subs);
        }, 'Listing user subscriptions', [
            'user_id' => $request->user()->id,
        ]);
    }

    // Admin: List all subscriptions
    public function all()
    {
        return $this->safeCall(fn() => response()->json(
            Subscription::with([
                'user:id,first_name,last_name,email',
                'plan:id,name,duration_days'
            ])->get()
        ), 'Listing all subscriptions');
    }

    // Landlord subscribes to a new paid plan
    public function subscribe(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'plan_id' => 'required|exists:plans,id',
            ]);

            $user = $request->user();

            if ($this->landlordHasActivePaidSubscription($user)) {
                return response()->json(['message' => 'You already have an active paid subscription.'], 400);
            }

            if ($this->landlordHasPendingSubscriptionForPlan($user, $data['plan_id'])) {
                return response()->json(['message' => 'You already have a pending subscription for this plan.'], 400);
            }

            $sub = $this->createPendingSubscription($user, $data['plan_id']);
            return response()->json($sub, 201);
        }, 'Subscribing to plan', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    // Admin: Activate subscription, expire previous ones
    public function activate(Request $request, $id)
    {
        return $this->safeCall(function () use ($id) {
            $sub = Subscription::with('plan')->findOrFail($id);
            $user = $sub->user;

            $this->expirePreviousPaidSubscriptions($user);

            $now = Carbon::now();
            $sub->update([
                'status' => 'active',
                'started_at' => $now,
                'ends_at' => $sub->plan->duration_days
                    ? $now->copy()->addDays($sub->plan->duration_days)
                    : null,
            ]);

            return response()->json($sub);
        }, 'Activating subscription', [
            'subscription_id' => $id,
        ]);
    }

    // Landlord: cancel pending subscription
    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $subscription = Subscription::findOrFail($id);

            if ($subscription->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($subscription->status !== 'pending') {
                return response()->json(['message' => 'Only pending subscriptions can be deleted.'], 400);
            }

            $payments = SubscriptionPayment::where('subscription_id', $id)->get();
            foreach ($payments as $payment) {
                if ($payment->proof_image && Storage::disk('public')->exists($payment->proof_image)) {
                    Storage::disk('public')->delete($payment->proof_image);
                }
            }

            SubscriptionPayment::where('subscription_id', $id)->delete();
            $subscription->delete();

            return response()->json(['message' => 'Subscription canceled and related proof images deleted.']);
        }, 'Canceling subscription', [
            'subscription_id' => $id,
            'user_id' => $request->user()->id,
        ]);
    }
}
