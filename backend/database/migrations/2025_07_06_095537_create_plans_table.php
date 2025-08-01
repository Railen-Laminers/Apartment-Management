<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();

            // Plan name (e.g., Basic, Pro, Enterprise)
            $table->string('name');

            // Optional detailed description of the plan
            $table->text('description')->nullable();

            // Max number of properties allowed. NULL = Unlimited
            $table->unsignedInteger('allowed_properties')->nullable()->default(null);

            // Max number of units allowed. NULL = Unlimited
            $table->unsignedInteger('allowed_units')->nullable()->default(null);

            // Optional JSON column to store enabled notifications (e.g., ["email", "sms"])
            $table->json('enable_notifications')->nullable();

            // Price of the plan (e.g., 19.99)
            $table->decimal('price', 10, 2)->default(0);

            // Duration of the plan in days. NULL = Unlimited duration
            $table->unsignedInteger('duration_days')->nullable()->default(null);

            // Whether this is the default plan for new users
            $table->boolean('is_default')->default(false);

            // Whether this plan is currently active
            $table->boolean('is_active')->default(true);

            // Timestamps: created_at and updated_at
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
