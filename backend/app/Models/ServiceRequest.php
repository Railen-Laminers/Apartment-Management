<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    protected $fillable = [
        'lease_id',
        'category',
        'details',
        'status',
        'priority',
        'requested_by'
    ];

    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}

