<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trade_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['sale', 'trade', 'quick_sale']);
            $table->unsignedBigInteger('total_amount');
            $table->decimal('commission_rate', 5, 2);
            $table->unsignedBigInteger('commission_amount');
            $table->bigInteger('soulte_amount')->nullable();
            $table->enum('payment_method', ['mtn_momo', 'moov_money', 'card'])->nullable();
            $table->string('payment_reference')->nullable();
            $table->enum('status', [
                'pending',
                'in_escrow',
                'completed',
                'refunded',
                'disputed'
            ])->default('pending');
            $table->timestamp('retraction_deadline')->nullable();
            $table->timestamp('escrow_released_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
