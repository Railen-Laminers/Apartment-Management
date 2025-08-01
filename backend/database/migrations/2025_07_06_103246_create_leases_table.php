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
        Schema::create('leases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->onDelete('cascade');

            $table->foreignId('tenant_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->date('start_date');
            $table->date('end_date');

            $table->enum('status', ['pending', 'active', 'terminated'])
                ->default('pending');

            $table->decimal('security_deposit', 10, 2)->default(0);

            // ✅ JSON contract terms
            $table->json('contract_terms')->nullable();

            $table->text('notes')->nullable();
            $table->boolean('auto_renew')->default(false);

            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leases');
    }
};
