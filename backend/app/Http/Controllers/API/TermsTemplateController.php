<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TermsTemplate;
use Illuminate\Support\Facades\Log;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;

class TermsTemplateController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates;

    /**
     * LANDLORD: List their own terms templates with user agreements.
     */
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $templates = $request->user()
                ->termsTemplates()
                ->with('agreements.user')
                ->get();

            return response()->json($templates);
        }, 'Fetching landlord terms templates', [
            'user_id' => $request->user()->id,
        ]);
    }

    /**
     * LANDLORD: Create a new terms template.
     */
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $validated = $request->validate([
                'category' => 'required|string|max:50',
                'content' => 'required|array',
            ]);

            // ✅ Prevent duplicate category for the same user
            $isDuplicate = $this->isDuplicate(new TermsTemplate(), $request, ['category'], [
                'user_id' => $request->user()->id,
            ]);

            if ($isDuplicate) {
                return response()->json([
                    'message' => 'You already have a terms template with this category.',
                ], 409);
            }

            $template = $request->user()->termsTemplates()->create($validated);

            return response()->json($template, 201);
        }, 'Creating new terms template', [
            'user_id' => $request->user()->id,
            'input' => $request->all(),
        ]);
    }

    /**
     * LANDLORD: Update an existing terms template.
     */
    public function update(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $template = $request->user()->termsTemplates()->findOrFail($id);

            $validated = $request->validate([
                'category' => 'sometimes|required|string|max:50',
                'content' => 'sometimes|required|array',
            ]);

            // ✅ Check for duplicate category if it's being updated
            if ($request->has('category')) {
                $isDuplicate = $this->isDuplicate(
                    new TermsTemplate(),
                    $request,
                    ['category'],
                    ['user_id' => $request->user()->id],
                    $template->id // exclude current template from check
                );

                if ($isDuplicate) {
                    return response()->json([
                        'message' => 'Another template with this category already exists.',
                    ], 409);
                }
            }

            $template->update($validated);

            return response()->json($template);
        }, "Updating terms template ID {$id}", [
            'template_id' => $id,
            'user_id' => $request->user()->id,
            'input' => $request->all(),
        ]);
    }

    /**
     * LANDLORD: Delete a terms template.
     */
    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $template = $request->user()->termsTemplates()->findOrFail($id);
            $template->delete();

            return response()->json(['message' => 'Template deleted successfully.']);
        }, "Deleting terms template ID {$id}", [
            'template_id' => $id,
            'user_id' => $request->user()->id,
        ]);
    }
}
