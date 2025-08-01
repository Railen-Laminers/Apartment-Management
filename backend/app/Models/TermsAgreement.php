<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TermsAgreement extends Model
{
    protected $fillable = [
        'template_id',
        'user_id',
        'date_agreed'
    ];

    protected $casts = [
        'date_agreed' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(TermsTemplate::class, 'template_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // ✅ FIXED: renamed from tenant()
    }
}


