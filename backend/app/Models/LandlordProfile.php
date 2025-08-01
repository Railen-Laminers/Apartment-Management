<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandlordProfile extends Model
{
    protected $fillable = [
        'user_id',
        'business_info',
        'address',
        'payment_methods'
    ];

    protected $casts = [
        'payment_methods' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

