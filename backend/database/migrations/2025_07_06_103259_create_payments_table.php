<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_payments_table.php

    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lease_id')
                ->nullable()
                ->constrained('leases')
                ->onDelete('set null');
            $table->decimal('amount', 10, 2);
            $table->string('method'); // e.g. GCash, Cash, Credit Card
            $table->enum('payment_type', ['rent', 'deposit', 'utility', 'other']);
            $table->date('payment_date');
            $table->string('reference_number')->nullable();
            $table->string('proof_image')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending');
            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users');
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
