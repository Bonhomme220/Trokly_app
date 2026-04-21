<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_history', function (Blueprint $table) {
            $table->id();
            $table->string('iphone_model');
            $table->enum('capacity', ['64', '128', '256', '512', '1024']);
            $table->string('color');
            $table->enum('condition', ['new', 'like_new', 'good', 'fair']);
            $table->enum('quality_grade', ['A', 'B', 'C'])->nullable();
            $table->unsignedBigInteger('sale_price');
            $table->enum('transaction_type', ['marketplace', 'quick_sale', 'trade']);
            $table->date('sale_date');
            $table->timestamps();

            $table->index(['iphone_model', 'condition']);
            $table->index('sale_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_history');
    }
};
