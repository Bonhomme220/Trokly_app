<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->boolean('pickup_check_passed')->nullable()->after('status');
            $table->text('pickup_check_notes')->nullable()->after('pickup_check_passed');
            $table->timestamp('pickup_checked_at')->nullable()->after('pickup_check_notes');
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['pickup_check_passed', 'pickup_check_notes', 'pickup_checked_at']);
        });
    }
};
