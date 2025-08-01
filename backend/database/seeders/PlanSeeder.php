<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::create([
            'name' => 'Free',
            'description' => 'Free forever, limited features',
            'allowed_properties' => 1,
            'allowed_units' => 2,
            'duration_days' => null,
            'enable_notifications' => json_encode(['email']),
            'price' => 0.00,
            'is_default' => true,
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Basic',
            'description' => 'Entry‑level, 30‑day duration',
            'allowed_properties' => 5,
            'allowed_units' => 10,
            'duration_days' => 30,
            'enable_notifications' => json_encode(['email', 'telegram']),
            'price' => 19.99,
            'is_default' => false,
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Pro',
            'description' => 'Full features for 90 days',
            'allowed_properties' => 20,
            'allowed_units' => 50,
            'duration_days' => 90,
            'enable_notifications' => json_encode(['email', 'telegram', 'messenger']),
            'price' => 49.99,
            'is_default' => false,
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Enterprise',
            'description' => 'All‑access for one year',
            'allowed_properties' => null,
            'allowed_units' => null,
            'duration_days' => 365,
            'enable_notifications' => json_encode(['email', 'telegram', 'messenger']),
            'price' => 199.99,
            'is_default' => false,
            'is_active' => true,
        ]);
    }
}
