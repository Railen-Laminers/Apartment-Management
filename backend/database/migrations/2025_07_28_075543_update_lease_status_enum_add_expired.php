<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE leases MODIFY COLUMN status ENUM('pending', 'active', 'terminated', 'expired') DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE leases MODIFY COLUMN status ENUM('pending', 'active', 'terminated') DEFAULT 'pending'");
    }
};

