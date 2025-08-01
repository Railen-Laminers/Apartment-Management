<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TermsAgreement;
use App\Models\TermsTemplate;
use Illuminate\Support\Facades\Log;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;

class TermsAgreementController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates;

    /**
     * TENANT: List all terms agreements for the authenticated user.
     */
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $agreements = $request->user()
                ->termsAgreements()
                ->with('template')
                ->get();

            return response()->json($agreements);
        }, 'Fetching tenant agreements', [
            'user_id' => $request->user()->id,
        ]);
    }

    /**
     * TENANT: Store a new agreement to a terms template.
     */
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $validated = $request->validate([
                'template_id' => 'required|exists:terms_templates,id',
            ]);

            $userId = $request->user()->id;
            $templateId = $validated['template_id'];

            // ✅ Using trait instead of manual check
            $isDuplicate = $this->isDuplicate(new TermsAgreement(), $request, ['template_id'], [
                'user_id' => $userId
            ]);

            if ($isDuplicate) {
                return response()->json(['message' => 'Already agreed to this template.'], 409);
            }

            $agreement = TermsAgreement::create([
                'template_id' => $templateId,
                'user_id' => $userId,
                'date_agreed' => now(),
            ]);

            return response()->json($agreement, 201);
        }, 'Creating tenant agreement', [
            'user_id' => $request->user()->id,
            'template_id' => $request->input('template_id'),
        ]);
    }

    /**
     * TENANT: Get templates they haven't agreed to yet, from their landlord.
     */
    public function availableTemplates(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $tenant = $request->user();
            $lease = $tenant->leases()->where('status', 'active')->first();

            if (!$lease || !$lease->unit || !$lease->unit->property) {
                return response()->json(['message' => 'No active lease or linked property found.'], 404);
            }

            $landlordId = $lease->unit->property->owner_id;

            $landlordTemplates = TermsTemplate::where('user_id', $landlordId)->get();

            $agreedTemplateIds = $tenant->termsAgreements()
                ->pluck('template_id')
                ->toArray();

            $availableTemplates = $landlordTemplates->filter(function ($template) use ($agreedTemplateIds) {
                return !in_array($template->id, $agreedTemplateIds);
            })->values();

            return response()->json($availableTemplates);
        }, 'Fetching available templates', [
            'user_id' => $request->user()->id,
        ]);
    }
}
