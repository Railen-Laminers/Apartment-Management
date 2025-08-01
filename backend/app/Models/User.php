<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'role',
        'contact_number',
        'profile_image',
        'telegram_id',
        'messenger_psid',
        'messenger_link',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            // 'password' => 'hashed',
        ];
    }

    protected $appends = ['profile_image_url'];

    public function getProfileImageUrlAttribute()
    {
        return $this->profile_image ? asset($this->profile_image) : null;
    }


    // Profiles:
    public function landlordProfile()
    {
        return $this->hasOne(LandlordProfile::class);
    }

    public function tenantProfile()
    {
        return $this->hasOne(TenantProfile::class);
    }

    // If user is landlord owning many tenants:
    public function tenants()
    {
        return $this->hasMany(TenantProfile::class, 'landlord_id');
    }


    // Subcription and Plan
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active');
    }

    public function subscriptionPayments()
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    // properties owned by landlord
    public function properties()
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    // units through properties
    public function units()
    {
        return $this->hasManyThrough(Unit::class, Property::class, 'owner_id', 'property_id');
    }

    // leases where the user is tenant
    public function leases()
    {
        return $this->hasMany(Lease::class, 'tenant_id');
    }

    // payments they've submitted (tenants)
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // service requests they made
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'requested_by');
    }

    // notifications log
    public function notificationsLog()
    {
        return $this->hasMany(Notification::class);
    }

    // landlord’s term templates
    public function termsTemplates()
    {
        return $this->hasMany(TermsTemplate::class);
    }

    // tenant’s agreements
    public function termsAgreements()
    {
        return $this->hasMany(TermsAgreement::class);
    }

    public function financialRecords()
    {
        return $this->hasMany(FinancialRecord::class);
    }


}
