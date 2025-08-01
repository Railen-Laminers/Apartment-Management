<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait PreventsDuplicates
{
    /**
     * Check if a duplicate record exists based on fields.
     */
    public function isDuplicate($model, Request $request, array $uniqueFields, array $additionalConditions = [], int $excludeId = null): bool
    {
        /** @var Builder $query */
        $query = $model->newQuery();

        foreach ($uniqueFields as $field) {
            if ($request->has($field)) {
                $query->where($field, $request->input($field));
            }
        }

        foreach ($additionalConditions as $field => $value) {
            $query->where($field, $value);
        }

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
