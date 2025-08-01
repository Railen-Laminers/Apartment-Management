<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialRecord extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'category',
        'description',
        'amount',
        'related_payment_id',
        'due_date'
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function subscriptionPayment()
    {
        return $this->belongsTo(SubscriptionPayment::class);
    }

}
