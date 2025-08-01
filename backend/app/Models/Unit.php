<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = [
        'property_id',
        'unit_number',
        'rent_amount',
        'unit_type',
        'floor',
        'square_meters',
        'is_available'
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // current leases on a unit
    public function leases()
    {
        return $this->hasMany(Lease::class);
    }

}

