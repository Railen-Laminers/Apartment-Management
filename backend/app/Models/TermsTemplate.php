<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TermsTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'category',
        'content'
    ];

    protected $casts = [
        'content' => 'array',
    ];

    public function landlord()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function agreements()
    {
        return $this->hasMany(TermsAgreement::class, 'template_id');
    }
}

