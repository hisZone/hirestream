<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'jobseeker@example.com'],
            [
                'name' => 'Job Seeker User',
                'username' => 'jobseeker',
                'password' => Hash::make('password123'),
                'role' => UserRole::EMPLOYEE,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'employer@example.com'],
            [
                'name' => 'Employer User',
                'username' => 'employer',
                'password' => Hash::make('password123'),
                'role' => UserRole::EMPLOYER,
                'email_verified_at' => now(),
            ]
        );
    }
}
