<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('initiator_id')->constrained('users')->cascadeOnDelete();
            $table->string('initiator_iphone_model');
            $table->enum('initiator_capacity', ['64', '128', '256', '512', '1024']);
            $table->string('initiator_color');
            $table->enum('initiator_condition', ['new', 'like_new', 'good', 'fair']);
            $table->string('initiator_imei');
            $table->unsignedBigInteger('initiator_asking_soulte')->nullable();
            $table->unsignedBigInteger('platform_estimated_value')->nullable();
            $table->unsignedBigInteger('ai_suggested_soulte')->nullable();
            $table->enum('status', [
                'pending_estimation',
                'estimation_done',
                'in_negotiation',
                'agreed',
                'expertise_pending',
                'expertise_done',
                'completed',
                'cancelled',
                'expired'
            ])->default('pending_estimation');
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('trade_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->unsignedTinyInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('trade_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offered_by')->constrained('users')->cascadeOnDelete();
            $table->bigInteger('soulte_amount');
            $table->unsignedTinyInteger('round_number');
            $table->enum('status', ['pending', 'accepted', 'countered', 'refused'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_offers');
        Schema::dropIfExists('trade_photos');
        Schema::dropIfExists('trades');
    }
};
