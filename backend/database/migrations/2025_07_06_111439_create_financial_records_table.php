<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFinancialRecordsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('financial_records', function (Blueprint $table) {
            $table->id();

            // User who owns the financial record
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            // Type of financial record: income or expense
            $table->enum('type', ['income', 'expense']);

            // Category of the record (e.g., rent, repair, utility)
            $table->string('category');

            // Optional description or notes
            $table->text('description')->nullable();

            // Amount involved in the record
            $table->decimal('amount', 15, 2);

            // Optional relation to a standard payment (e.g., rent payment)
            $table->foreignId('payment_id') // Renamed from related_payment_id
                ->nullable()
                ->constrained('payments')
                ->onDelete('set null');

            // Optional relation to a subscription payment
            $table->foreignId('subscription_payment_id')
                ->nullable()
                ->constrained('subscription_payments')
                ->onDelete('set null');

            // Optional due date of the financial item (e.g., bill due)
            $table->date('due_date')->nullable();

            // created_at and updated_at
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_records');
    }
}
