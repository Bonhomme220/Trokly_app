<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Users : email devient requis, phone_number devient nullable
        Schema::table('users', function (Blueprint $table) {
            // Temporary: fill email from phone for existing users without email
            DB::table('users')->whereNull('email')->orWhere('email', '')->update([
                'email' => DB::raw("CONCAT(phone_number, '@trokly.temp')"),
            ]);

            $table->string('email')->nullable(false)->change();
            $table->string('phone_number')->nullable()->change();
            $table->boolean('email_verified')->default(false)->after('email');
        });

        // OTP codes : ajouter identifier email
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('email')->nullable()->after('id');
            $table->index('email');
            $table->string('phone_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('phone_number')->nullable(false)->change();
            $table->dropColumn('email_verified');
        });

        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
            $table->string('phone_number')->nullable(false)->change();
        });
    }
};
