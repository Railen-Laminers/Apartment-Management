<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_notifications_table.php

    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->enum('channel', ['email', 'telegram', 'messenger']);
            $table->string('event');           // e.g. 'ServiceRequestCreated'
            $table->json('payload')->nullable();
            $table->enum('status', ['sent', 'failed', 'queued'])
                ->default('queued');
            $table->unsignedInteger('attempts')
                ->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
