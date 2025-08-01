<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'lease_id',
        'amount',
        'method',
        'payment_type',
        'payment_date',
        'reference_number',
        'proof_image',
        'status',
        'verified_by'
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    protected $appends = ['proof_image_url'];

    public function getProofImageUrlAttribute()
    {
        return $this->proof_image ? asset('storage/' . $this->proof_image) : null;
    }


    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

