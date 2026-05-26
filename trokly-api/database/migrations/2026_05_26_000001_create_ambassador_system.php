<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Codes ambassadeurs ──────────────────────────────────────────
        Schema::create('ambassador_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20)->unique();
            $table->unsignedTinyInteger('discount_percent')->default(20); // % réduction pour l'acheteur
            $table->unsignedTinyInteger('commission_percent')->default(10); // % commission ambassadeur
            $table->unsignedInteger('uses_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── Wallets ambassadeurs ────────────────────────────────────────
        Schema::create('ambassador_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('balance')->default(0);       // FCFA disponibles
            $table->unsignedInteger('total_earned')->default(0);  // cumulatif
            $table->unsignedInteger('total_withdrawn')->default(0);
            $table->timestamp('last_withdrawal_at')->nullable();
            $table->timestamps();
        });

        // ── Earnings (une ligne par utilisation du code) ───────────────
        Schema::create('ambassador_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ambassador_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ambassador_wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->string('plan');
            $table->unsignedInteger('amount_paid');       // ce que l'acheteur a payé
            $table->unsignedInteger('original_price');    // prix sans réduction
            $table->unsignedInteger('discount_amount');   // montant remisé
            $table->unsignedInteger('commission_amount'); // gains ambassadeur
            $table->timestamps();
        });

        // ── Demandes de retrait ─────────────────────────────────────────
        Schema::create('ambassador_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ambassador_wallet_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->string('payment_method')->default('mobile_money'); // moov/mtn/etc
            $table->string('payment_details')->nullable(); // numéro de téléphone
            $table->text('admin_note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // ── Champs sur listings ─────────────────────────────────────────
        Schema::table('listings', function (Blueprint $table) {
            $table->string('ambassador_code')->nullable()->after('payment_reference');
            $table->unsignedInteger('discount_amount')->default(0)->after('ambassador_code');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['ambassador_code', 'discount_amount']);
        });
        Schema::dropIfExists('ambassador_withdrawals');
        Schema::dropIfExists('ambassador_earnings');
        Schema::dropIfExists('ambassador_wallets');
        Schema::dropIfExists('ambassador_codes');
    }
};
