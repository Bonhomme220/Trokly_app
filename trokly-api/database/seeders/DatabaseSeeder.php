<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolesSeeder::class);

        $admin = User::firstOrCreate(
            ['phone_number' => '+22900000000'],
            [
                'full_name' => 'Super Admin Trokly',
                'phone_verified' => true,
                'is_active' => true,
            ]
        );

        $admin->assignRole('super_admin');

        if (!$admin->wallet) {
            Wallet::create(['user_id' => $admin->id]);
        }
    }
}
