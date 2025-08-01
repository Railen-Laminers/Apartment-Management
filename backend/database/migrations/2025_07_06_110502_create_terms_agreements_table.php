<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_terms_agreements_table.php

    public function up(): void
    {
        Schema::create('terms_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')           // which template was agreed
                ->constrained('terms_templates')
                ->onDelete('cascade');
            $table->foreignId('user_id')               // tenant who agrees
                ->constrained('users')
                ->onDelete('cascade');
            $table->timestamp('date_agreed');
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('terms_agreements');
    }
};
