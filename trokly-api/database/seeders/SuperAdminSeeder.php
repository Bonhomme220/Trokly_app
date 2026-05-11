<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPER_ADMIN_EMAIL');
        if (!$email) return;

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'full_name'      => env('SUPER_ADMIN_NAME', 'Super Admin'),
                'email_verified' => true,
                'is_active'      => true,
            ]
        );

        Wallet::firstOrCreate(['user_id' => $user->id]);

        if (!$user->hasRole('super_admin')) {
            $user->assignRole('super_admin');
        }
    }
}
