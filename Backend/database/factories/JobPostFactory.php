<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ExperienceLevel;
use App\Enums\JobStatus;
use App\Enums\JobType;
use App\Models\Category;
use App\Models\Employer;
use App\Models\JobPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<JobPost>
 */
class JobPostFactory extends Factory
{
    protected $model = JobPost::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->jobTitle();

        return [
            'employer_id' => Employer::factory(),
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'description' => fake()->paragraphs(3, true),
            'requirements' => [fake()->sentence(), fake()->sentence(), fake()->sentence()],
            'responsibilities' => [fake()->sentence(), fake()->sentence()],
            'job_type' => fake()->randomElement(JobType::cases()),
            'experience_level' => fake()->randomElement(ExperienceLevel::cases()),
            'location' => fake()->city().', '.fake()->country(),
            'salary_min' => 50000,
            'salary_max' => 90000,
            'salary_currency' => 'USD',
            'is_remote' => fake()->boolean(),
            'status' => JobStatus::DRAFT,
            'rejection_reason' => null,
            'published_at' => null,
            'expires_at' => null,
            'views_count' => 0,
        ];
    }

    /**
     * Indicate that the job post is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobStatus::PUBLISHED,
            'published_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
    }

    /**
     * Indicate that the job post is pending approval.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobStatus::PENDING_APPROVAL,
        ]);
    }

    /**
     * Indicate that the job post is rejected.
     */
    public function rejected(?string $reason = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobStatus::REJECTED,
            'rejection_reason' => $reason ?? 'Does not meet posting criteria.',
        ]);
    }

    /**
     * Indicate that the job post is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobStatus::CLOSED,
        ]);
    }
}
