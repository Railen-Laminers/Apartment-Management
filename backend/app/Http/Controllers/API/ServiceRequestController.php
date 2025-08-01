<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceRequest;
use App\Models\Lease;
use App\Events\SignificantNotificationEvent;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;
use App\Traits\ValidatesLease;

class ServiceRequestController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates, ValidatesLease;

    // TENANT: list own service requests
    public function indexTenant(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $requests = $request->user()
                ->serviceRequests()
                ->with('lease.unit.property')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($requests);
        }, 'Listing tenant service requests', [
            'user_id' => $request->user()->id,
        ]);
    }

    // TENANT: submit a new service request
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'lease_id' => 'required|exists:leases,id',
                'category' => 'required|in:Internet,Repairs,Waste,Guest,Other',
                'details' => 'required|string',
                'priority' => 'required|in:low,medium,high',
            ]);

            $user = $request->user();

            $lease = $this->getValidTenantLease($data['lease_id'], $user);

            if (!$lease) {
                return response()->json([
                    'message' => 'You can only submit service requests for your active leases.',
                ], 403);
            }

            $data['requested_by'] = $user->id;

            if (
                $this->isDuplicate(new ServiceRequest(), $request, [
                    'lease_id',
                    'category',
                    'details',
                    'priority'
                ], ['requested_by' => $user->id])
            ) {
                return response()->json(['message' => 'You have already submitted a similar service request.'], 409);
            }

            $sr = ServiceRequest::create($data);

            // Notify landlord
            $landlord = $sr->lease->unit->property->owner;
            event(new SignificantNotificationEvent(
                user_id: $landlord->id,
                subject: 'New Service Request',
                message: "A new service request ({$sr->category}) was submitted by {$user->first_name} {$user->last_name}."
            ));

            return response()->json($sr, 201);
        }, 'Creating service request', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
        ]);
    }

    // LANDLORD: list service requests for owned leases
    public function indexLandlord(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $unitIds = $request->user()->units()->pluck('units.id');
            if ($unitIds->isEmpty()) {
                return response()->json([]);
            }

            $leaseIds = Lease::whereIn('unit_id', $unitIds)->pluck('id');
            if ($leaseIds->isEmpty()) {
                return response()->json([]);
            }

            $requests = ServiceRequest::whereIn('lease_id', $leaseIds)
                ->with(['requester', 'lease.unit.property'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($requests);
        }, 'Listing landlord service requests', [
            'user_id' => $request->user()->id,
        ]);
    }

    // LANDLORD: update status of a service request
    public function updateStatus(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $data = $request->validate([
                'status' => 'required|in:approved,resolved,rejected',
            ]);

            $sr = ServiceRequest::findOrFail($id);
            abort_if(
                $request->user()->id !== $sr->lease->unit->property->owner_id,
                403,
                'You do not have permission to update this service request.'
            );

            $sr->update($data);

            // Notify tenant
            $tenant = $sr->lease->tenant;
            event(new SignificantNotificationEvent(
                user_id: $tenant->id,
                subject: "Service Request {$data['status']}",
                message: "Your request for '{$sr->category}' has been marked as '{$data['status']}'."
            ));

            return response()->json($sr);
        }, 'Updating service request status', [
            'user_id' => $request->user()->id,
            'service_request_id' => $id,
            'request_data' => $request->all(),
        ]);
    }
}
