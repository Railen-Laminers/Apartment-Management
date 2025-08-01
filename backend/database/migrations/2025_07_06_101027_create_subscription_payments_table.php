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
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();

            // Reference to the user who made the payment (typically the landlord)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Reference to the related subscription
            $table->foreignId('subscription_id')->constrained('subscriptions')->onDelete('cascade');

            // Payment amount
            $table->decimal('amount', 10, 2);

            // Payment method (e.g., GCash, Credit Card)
            $table->string('method');

            // Optional reference number provided by the payment gateway
            $table->string('reference_number')->nullable();

            // Optional path to the uploaded image as proof of payment
            $table->string('proof_image')->nullable();

            // Payment status: pending (default), approved, or rejected
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            // Admin user who reviewed and verified the payment (nullable)
            $table->foreignId('reviewed_by')->nullable()->constrained('users');

            // Date and time when the payment was made (can be null initially)
            $table->timestamp('payment_date')->nullable();

            // Date and time when the payment was verified (approved or rejected)
            $table->timestamp('verified_at')->nullable();

            // Optional reason for rejection if status is rejected
            $table->text('rejection_reason')->nullable();

            // Created at and updated at timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
