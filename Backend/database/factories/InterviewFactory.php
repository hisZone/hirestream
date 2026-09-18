<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Application;
use App\Models\Employer;
use App\Models\Interview;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Interview>
 */
class InterviewFactory extends Factory
{
    protected $model = Interview::class;

    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'employer_id' => Employer::factory(),
            'user_id' => User::factory(),
            'job_post_id' => JobPost::factory(),
            'title' => 'Technical Interview',
            'type' => 'video',
            'scheduled_at' => now()->addDays(3),
            'duration_minutes' => 45,
            'timezone' => 'UTC',
            'meeting_link' => 'https://meet.google.com/test-link',
            'location' => null,
            'notes' => 'Please prepare a brief overview of your background.',
            'status' => 'scheduled',
        ];
    }
}
