<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SubscriptionPayment;
use App\Models\Subscription;
use App\Models\FinancialRecord;
use App\Events\SignificantNotificationEvent;
use Illuminate\Support\Facades\Validator;
use App\Traits\HandlesApiExceptions;
use App\Traits\HandlesSubscriptions;
use App\Traits\PreventsDuplicates;
use Carbon\Carbon;

class SubscriptionPaymentController extends Controller
{
    use HandlesApiExceptions, HandlesSubscriptions, PreventsDuplicates;

    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $payments = $request->user()
                ->subscriptionPayments()
                ->with('subscription.plan')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($payments);
        }, 'Fetching tenant subscription payments', [
            'user_id' => $request->user()->id
        ]);
    }

    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $validator = Validator::make($request->all(), [
                'subscription_id' => 'required|exists:subscriptions,id',
                'amount' => 'required|numeric|min:0',
                'method' => 'required|string|max:50',
                'reference_number' => 'nullable|string|max:100',
                'proof_image' => 'nullable|image|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();
            $data['payment_date'] = now();
            $data['status'] = 'pending';

            $subscription = Subscription::findOrFail($data['subscription_id']);
            abort_if($subscription->user_id !== $request->user()->id, 403);

            $isDuplicate = $this->isDuplicate(new SubscriptionPayment(), $request, [
                'subscription_id',
                'amount',
                'method',
                'reference_number'
            ], [
                'user_id' => $request->user()->id,
            ]);

            if ($isDuplicate) {
                return response()->json([
                    'message' => 'A similar subscription payment has already been submitted.',
                ], 409);
            }

            if ($request->hasFile('proof_image')) {
                $data['proof_image'] = $request->file('proof_image')->store('subscription_payments', 'public');
            }

            $payment = SubscriptionPayment::create([
                ...$data,
                'user_id' => $request->user()->id,
            ]);

            // ✅ Notify admin of new subscription payment
            // if ($admin = User::where('role', 'admin')->first()) {
            //     event(new SignificantNotificationEvent(
            //         user_id: $admin->id,
            //         subject: 'New Subscription Payment',
            //         message: "{$request->user()->first_name} submitted a payment of ₱{$data['amount']}."
            //     ));
            // }

            return response()->json($payment, 201);
        }, 'Submitting subscription payment', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    public function allPaymentsForAdmin()
    {
        return $this->safeCall(function () {
            return response()->json(
                SubscriptionPayment::with([
                    'subscription.plan',
                    'landlord:id,first_name,last_name,email',
                    'reviewer:id,first_name,last_name,email'
                ])->orderBy('created_at', 'desc')->get()
            );
        }, 'Fetching all subscription payments');
    }

    public function approve(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            abort_if($request->user()->role !== 'admin', 403);

            $payment = SubscriptionPayment::findOrFail($id);
            $subscription = $payment->subscription;
            $user = $subscription->user;

            $this->expirePreviousPaidSubscriptions($user);

            $payment->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'verified_at' => now(),
            ]);

            $start = Carbon::now();
            $end = $subscription->plan->duration_days
                ? $start->copy()->addDays($subscription->plan->duration_days)
                : null;

            $subscription->update([
                'status' => 'active',
                'started_at' => $start,
                'ends_at' => $end,
            ]);

            FinancialRecord::create([
                'user_id' => $request->user()->id,
                'type' => 'income',
                'category' => 'Subscription Payment',
                'description' => "Payment from {$user->first_name} {$user->last_name}",
                'amount' => $payment->amount,
                'subscription_payment_id' => $payment->id,
            ]);

            FinancialRecord::create([
                'user_id' => $user->id,
                'type' => 'expense',
                'category' => 'Subscription Fee',
                'description' => "Payment for {$subscription->plan->name} plan",
                'amount' => $payment->amount,
                'subscription_payment_id' => $payment->id,
            ]);

            // ✅ Notify user of approval
            // event(new SignificantNotificationEvent(
            //     user_id: $user->id,
            //     subject: 'Subscription Approved',
            //     message: 'Your subscription payment has been approved. Enjoy your plan!'
            // ));

            return response()->json($payment);
        }, 'Approving subscription payment', [
            'payment_id' => $id,
            'admin_id' => $request->user()->id,
        ]);
    }

    public function reject(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            abort_if($request->user()->role !== 'admin', 403);

            $payment = SubscriptionPayment::with('subscription')->findOrFail($id);
            $subscription = $payment->subscription;
            $user = $subscription->user;

            $reason = $request->input('rejection_reason', 'Payment rejected and subscription canceled.');

            $payment->update([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'verified_at' => now(),
                'rejection_reason' => $reason,
            ]);

            if ($subscription->status === 'pending') {
                $subscription->update(['status' => 'canceled']);
            }

            // ✅ Notify user of rejection

            // event(new SignificantNotificationEvent(
            //     user_id: $user->id,
            //     subject: 'Subscription Rejected',
            //     message: "Your subscription payment was rejected. Reason: {$reason}"
            // ));

            return response()->json([
                'message' => 'Payment rejected and subscription canceled.',
                'reason' => $reason,
            ]);
        }, 'Rejecting subscription payment', [
            'payment_id' => $id,
            'admin_id' => $request->user()->id,
        ]);
    }

    public function landlordHistory(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            abort_if($request->user()->role !== 'landlord', 403);

            $payments = SubscriptionPayment::where('user_id', $request->user()->id)
                ->with([
                    'subscription.plan',
                    'reviewer:id,first_name,last_name',
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($payments);
        }, 'Fetching landlord subscription payment history', [
            'user_id' => $request->user()->id,
        ]);
    }
}
