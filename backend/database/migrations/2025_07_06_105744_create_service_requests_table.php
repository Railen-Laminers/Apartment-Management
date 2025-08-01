<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_service_requests_table.php

    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lease_id')
                ->constrained('leases')
                ->onDelete('cascade');
            $table->enum('category', ['Internet', 'Repairs', 'Waste', 'Guest', 'Other']);
            $table->text('details');
            $table->enum('status', ['pending', 'approved', 'resolved', 'rejected'])
                ->default('pending');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->foreignId('requested_by')
                ->constrained('users')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
