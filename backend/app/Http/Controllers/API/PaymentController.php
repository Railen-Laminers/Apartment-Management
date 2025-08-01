<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Lease;
use App\Models\FinancialRecord;
use App\Events\SignificantNotificationEvent;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;
use App\Traits\ValidatesLease;

class PaymentController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates, ValidatesLease;

    // TENANT: list own payments
    public function indexTenant(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $tenantId = $request->user()->id;

            $payments = Payment::whereHas('lease', fn($q) => $q->where('tenant_id', $tenantId))
                ->with(['lease.unit.property', 'verifier'])
                ->get()
                ->each->append('proof_image_url');

            return response()->json($payments);
        }, 'Listing tenant payments', [
            'user_id' => $request->user()->id,
        ]);
    }

    // TENANT: submit a payment
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'lease_id' => 'required|exists:leases,id',
                'amount' => 'required|numeric|min:0',
                'method' => 'required|string',
                'payment_type' => 'required|in:rent,deposit,utility,other',
                'payment_date' => 'required|date',
                'reference_number' => 'required|string',
                'proof_image' => 'required|image|max:2048',
            ]);

            $user = $request->user();

            $lease = $this->getValidTenantLease($data['lease_id'], $user);

            if (!$lease) {
                return response()->json([
                    'message' => 'You can only submit payments for your active leases.',
                ], 403);
            }

            if (
                $this->isDuplicate(new Payment(), $request, [
                    'lease_id',
                    'amount',
                    'payment_date',
                    'reference_number'
                ])
            ) {
                return response()->json([
                    'message' => 'Duplicate payment detected. This payment already exists.',
                ], 409);
            }

            $data['proof_image'] = $request->file('proof_image')->store('payments', 'public');

            $payment = Payment::create($data + ['status' => 'pending']);

            // ✅ Notify landlord
            $landlordId = $lease->unit->property->owner_id;
            // event(new SignificantNotificationEvent(
            //     user_id: $landlordId,
            //     subject: 'New Rent Payment Submitted',
            //     message: "A new {$data['payment_type']} payment of ₱{$data['amount']} has been submitted by {$user->first_name} {$user->last_name}."
            // ));

            return response()->json($payment->append('proof_image_url'), 201);
        }, 'Storing tenant payment', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    // LANDLORD: list payments for leases they own
    public function indexLandlord(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $user = $request->user();

            $leaseIds = Lease::whereIn('unit_id', $user->units()->pluck('units.id'))->pluck('id');

            $payments = Payment::whereIn('lease_id', $leaseIds)
                ->with('lease.tenant')
                ->get()
                ->each->append('proof_image_url');

            return response()->json($payments);
        }, 'Listing landlord payments', [
            'user_id' => $request->user()->id,
        ]);
    }

    // LANDLORD: approve or reject a payment
    public function review(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $payment = Payment::with('lease.unit.property', 'lease.tenant')->findOrFail($id);
            $lease = $payment->lease;

            abort_if($request->user()->id !== $lease->unit->property->owner_id, 403);

            $data = $request->validate([
                'status' => 'required|in:approved,rejected',
            ]);

            $payment->update([
                'status' => $data['status'],
                'verified_by' => $request->user()->id,
            ]);

            // ✅ Notify tenant
            $tenant = $lease->tenant;
            // event(new SignificantNotificationEvent(
            //     user_id: $tenant->id,
            //     subject: "Payment {$data['status']}",
            //     message: "Your payment of ₱{$payment->amount} on {$payment->payment_date} has been {$data['status']} by your landlord."
            // ));

            // ✅ Log approved payment as income
            if (
                $data['status'] === 'approved' &&
                !FinancialRecord::where('payment_id', $payment->id)->exists()
            ) {
                FinancialRecord::create([
                    'user_id' => $request->user()->id,
                    'type' => 'income',
                    'category' => $payment->payment_type,
                    'description' => "Payment from {$tenant->first_name} {$tenant->last_name}",
                    'amount' => $payment->amount,
                    'payment_id' => $payment->id,
                    'due_date' => $payment->payment_date,
                ]);
            }

            return response()->json($payment->append('proof_image_url'));
        }, 'Reviewing payment', [
            'user_id' => $request->user()->id,
            'payment_id' => $id,
            'request_data' => $request->all(),
        ]);
    }
}
