<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantProfile extends Model
{
    protected $fillable = [
        'user_id',
        'landlord_id',
        'occupation',
        'income',
        'civil_status',
        'dependents',
        'employer_info',
        'valid_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function landlord()
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }
}

