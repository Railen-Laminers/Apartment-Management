<?php

// app/Models/SubscriptionPayment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'amount',
        'method',
        'reference_number',
        'proof_image',
        'status',
        'reviewed_by',
        'payment_date',
        'verified_at',
        'rejection_reason',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'verified_at' => 'datetime',
    ];

    protected $appends = ['proof_image_url'];

    public function getProofImageUrlAttribute()
    {
        return $this->proof_image ? asset('storage/' . $this->proof_image) : null;
    }


    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

