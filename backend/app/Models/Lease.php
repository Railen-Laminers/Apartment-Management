<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lease extends Model
{
    protected $fillable = [
        'unit_id',
        'tenant_id',
        'start_date',
        'end_date',
        'status',
        'security_deposit',
        'contract_terms',
        'notes',
        'auto_renew'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'auto_renew' => 'boolean',
        'security_deposit' => 'decimal:2',
        'contract_terms' => 'array', // ✅ Cast contract_terms to array
    ];

    // Relationships
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}