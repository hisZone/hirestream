<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_post_id' => JobPost::factory(),
            'cv_path' => 'cvs/applications/'.$this->faker->uuid().'.pdf',
            'cover_letter' => $this->faker->optional()->paragraph(),
            'status' => ApplicationStatus::SUBMITTED,
        ];
    }
}
