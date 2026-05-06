<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $phone = env('SUPER_ADMIN_PHONE');
        if (!$phone) return;

        $user = User::firstOrCreate(
            ['phone_number' => $phone],
            [
                'full_name'      => env('SUPER_ADMIN_NAME', 'Super Admin'),
                'phone_verified' => true,
                'is_active'      => true,
            ]
        );

        Wallet::firstOrCreate(['user_id' => $user->id]);

        if (!$user->hasRole('super_admin')) {
            $user->assignRole('super_admin');
        }
    }
}
