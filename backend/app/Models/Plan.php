<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'allowed_properties',
        'allowed_units',
        'enable_notifications',
        'price',
        'duration_days',
        'is_default',
        'is_active'
    ];

    protected $casts = [
        'enable_notifications' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}

