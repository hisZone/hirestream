<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'temesgensidatst@gmail.com'],
            [
                'name' => 'temesgen sida',
                'username' => 'temesgensida',
                'password' => Hash::make('Te1to2ge3si4'),
                'role' => UserRole::ADMIN,
                'email_verified_at' => now(),
            ]
        );
    }
}
