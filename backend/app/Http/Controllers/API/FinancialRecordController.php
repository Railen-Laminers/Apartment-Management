<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FinancialRecord;
use Illuminate\Support\Facades\DB;
use App\Traits\HandlesApiExceptions;
use App\Traits\PreventsDuplicates;

class FinancialRecordController extends Controller
{
    use HandlesApiExceptions, PreventsDuplicates;

    // List records for authenticated user
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $records = $request->user()
                ->financialRecords()
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($records);
        }, 'Fetching financial records', [
            'user_id' => $request->user()->id,
        ]);
    }

    // Create a new record
    public function store(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $data = $request->validate([
                'type' => 'required|in:income,expense',
                'category' => 'required|string|max:50',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'payment_id' => 'nullable|exists:payments,id',
                'subscription_payment_id' => 'nullable|exists:subscription_payments,id',
                'due_date' => 'nullable|date',
            ]);

            if (!empty($data['payment_id']) && !empty($data['subscription_payment_id'])) {
                return response()->json([
                    'error' => 'Only one of payment_id or subscription_payment_id should be provided.'
                ], 422);
            }

            // Prevent duplicate
            $model = new FinancialRecord();
            $isDuplicate = $this->isDuplicate($model, $request, [
                'type',
                'category',
                'amount',
                'due_date'
            ], [
                'user_id' => $request->user()->id,
            ]);

            if ($isDuplicate) {
                return response()->json(['message' => 'Duplicate financial record detected.'], 409);
            }

            $record = FinancialRecord::create([
                'user_id' => $request->user()->id,
                ...$data,
            ]);

            return response()->json($record, 201);
        }, 'Creating financial record', [
            'user_id' => $request->user()->id,
            'input' => $request->all(),
        ]);
    }

    // View a single record
    public function show(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $record = $request->user()
                ->financialRecords()
                ->findOrFail($id);

            return response()->json($record);
        }, 'Fetching financial record', [
            'user_id' => $request->user()->id,
            'record_id' => $id,
        ]);
    }

    // Update a record
    public function update(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $record = $request->user()
                ->financialRecords()
                ->findOrFail($id);

            $data = $request->validate([
                'type' => 'sometimes|required|in:income,expense',
                'category' => 'sometimes|required|string|max:50',
                'description' => 'nullable|string',
                'amount' => 'sometimes|required|numeric|min:0',
                'payment_id' => 'nullable|exists:payments,id',
                'subscription_payment_id' => 'nullable|exists:subscription_payments,id',
                'due_date' => 'nullable|date',
            ]);

            if (!empty($data['payment_id']) && !empty($data['subscription_payment_id'])) {
                return response()->json([
                    'error' => 'Only one of payment_id or subscription_payment_id should be provided.'
                ], 422);
            }

            $record->update($data);
            return response()->json($record);
        }, 'Updating financial record', [
            'user_id' => $request->user()->id,
            'record_id' => $id,
            'input' => $request->all(),
        ]);
    }

    // Delete a record
    public function destroy(Request $request, $id)
    {
        return $this->safeCall(function () use ($request, $id) {
            $record = $request->user()
                ->financialRecords()
                ->findOrFail($id);

            $record->delete();
            return response()->json(['message' => 'Deleted'], 200);
        }, 'Deleting financial record', [
            'user_id' => $request->user()->id,
            'record_id' => $id,
        ]);
    }

    // Summary for a specific month/year
    public function summary(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $month = $request->query('month', now()->month);
            $year = $request->query('year', now()->year);

            $totals = FinancialRecord::where('user_id', $request->user()->id)
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->select([
                    DB::raw("SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income"),
                    DB::raw("SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense"),
                    DB::raw("SUM(CASE WHEN type='income' THEN amount WHEN type='expense' THEN -amount ELSE 0 END) as net"),
                ])
                ->first();

            return response()->json([
                'month' => (int) $month,
                'year' => (int) $year,
                'total_income' => (float) ($totals->total_income ?? 0),
                'total_expense' => (float) ($totals->total_expense ?? 0),
                'net' => (float) ($totals->net ?? 0),
            ]);
        }, 'Fetching financial summary', [
            'user_id' => $request->user()->id,
            'month' => $request->query('month'),
            'year' => $request->query('year'),
        ]);
    }
}
