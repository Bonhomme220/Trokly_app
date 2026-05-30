<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
    }
};
