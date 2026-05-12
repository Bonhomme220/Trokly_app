<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->enum('plan', ['basic', 'verified_phone', 'verified_seller'])->default('basic')->after('sale_type');
            $table->boolean('is_boosted')->default(false)->after('plan');
            $table->string('whatsapp_number', 20)->nullable()->after('is_boosted');
            $table->timestamp('expires_at')->nullable()->after('whatsapp_number');
            $table->enum('payment_status', ['pending_payment', 'paid'])->default('pending_payment')->after('expires_at');
            $table->string('payment_reference')->nullable()->after('payment_status');
            $table->timestamp('sold_at')->nullable()->after('payment_reference');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('listing_credits')->default(0)->after('email_verified');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['plan', 'is_boosted', 'whatsapp_number', 'expires_at', 'payment_status', 'payment_reference', 'sold_at']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('listing_credits');
        });
    }
};
