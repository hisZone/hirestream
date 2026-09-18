<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'icon' => fake()->randomElement(['💻', '🎨', '📈', '🧑‍💼']),
            'display_order' => fake()->numberBetween(0, 10),
            'is_active' => true,
        ];
    }
}
