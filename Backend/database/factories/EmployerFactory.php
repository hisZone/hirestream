<?php

namespace Database\Factories;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employer>
 */
class EmployerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'employer'])->create()->id,
            'company_name' => fake()->company(),
            'description' => fake()->paragraph(),
            'logo' => null,
            'website' => fake()->url(),
            'location' => fake()->city(),
        ];
    }
}
