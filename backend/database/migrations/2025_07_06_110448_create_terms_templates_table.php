<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_terms_templates_table.php

    public function up(): void
    {
        Schema::create('terms_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')               // landlord who owns it
                ->constrained('users')
                ->onDelete('cascade');
            $table->string('category');                // e.g. Pets, Visitors
            $table->json('content');                   // structured terms (could be text blocks)
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('terms_templates');
    }
};
