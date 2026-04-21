<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->string('iphone_model');
            $table->enum('capacity', ['64', '128', '256', '512', '1024']);
            $table->string('color');
            $table->enum('condition', ['new', 'like_new', 'good', 'fair']);
            $table->string('imei')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('asking_price');
            $table->unsignedBigInteger('ai_suggested_price')->nullable();
            $table->unsignedBigInteger('retail_price')->nullable();
            $table->boolean('accepts_trade')->default(false);
            $table->enum('sale_type', ['marketplace', 'quick_sale']);
            $table->enum('quality_grade', ['A', 'B', 'C'])->nullable();
            $table->enum('status', [
                'draft',
                'pending_expertise',
                'published',
                'sold',
                'rejected',
                'unpublished'
            ])->default('draft');
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('iphone_model');
            $table->index('sale_type');
        });

        Schema::create('listing_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->enum('type', ['seller', 'expertise']);
            $table->unsignedTinyInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_photos');
        Schema::dropIfExists('listings');
    }
};