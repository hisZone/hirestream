<?php

namespace Tests\Feature;

use App\Enums\JobStatus;
use App\Models\Category;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeSavedJobsTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_save_a_published_job(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $employer = Employer::factory()->create();
        $jobPost = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'status' => JobStatus::PUBLISHED,
        ]);

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response->assertStatus(201)
            ->assertJsonPath('data.job_post_id', $jobPost->id);

        $this->assertDatabaseHas('saved_jobs', [
            'user_id' => $employee->id,
            'job_post_id' => $jobPost->id,
        ]);
    }

    public function test_employee_cannot_save_draft_job(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $jobPost = JobPost::factory()->create(['status' => JobStatus::DRAFT]);

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response->assertStatus(422);
    }

    public function test_employee_can_list_saved_jobs(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $jobPost = JobPost::factory()->create(['status' => JobStatus::PUBLISHED]);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response = $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/employee/saved-jobs');

        $response->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.job_post.id', $jobPost->id);
    }

    public function test_employee_can_search_and_filter_saved_jobs(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $category1 = Category::factory()->create(['name' => 'Backend Development']);
        $category2 = Category::factory()->create(['name' => 'Design']);

        $job1 = JobPost::factory()->create([
            'title' => 'Senior Laravel Architect',
            'category_id' => $category1->id,
            'status' => JobStatus::PUBLISHED,
        ]);
        $job2 = JobPost::factory()->create([
            'title' => 'UI UX Lead',
            'category_id' => $category2->id,
            'status' => JobStatus::PUBLISHED,
        ]);

        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/employee/saved-jobs/{$job1->id}");
        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/employee/saved-jobs/{$job2->id}");

        $searchResponse = $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/employee/saved-jobs?search=Laravel');
        $searchResponse->assertOk()->assertJsonCount(1, 'data.data');

        $filterResponse = $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/employee/saved-jobs?category_id={$category2->id}");
        $filterResponse->assertOk()->assertJsonCount(1, 'data.data');
    }

    public function test_employee_can_get_saved_job_ids(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $jobPost = JobPost::factory()->create(['status' => JobStatus::PUBLISHED]);

        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response = $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/employee/saved-jobs/ids');

        $response->assertOk()
            ->assertJsonPath('data', [$jobPost->id]);
    }

    public function test_employee_can_unsave_job(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $jobPost = JobPost::factory()->create(['status' => JobStatus::PUBLISHED]);

        $this->actingAs($employee, 'sanctum')->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response = $this->actingAs($employee, 'sanctum')
            ->deleteJson("/api/v1/employee/saved-jobs/{$jobPost->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('saved_jobs', [
            'user_id' => $employee->id,
            'job_post_id' => $jobPost->id,
        ]);
    }

    public function test_employee_can_toggle_saved_job(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $jobPost = JobPost::factory()->create(['status' => JobStatus::PUBLISHED]);

        $res1 = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}/toggle");
        $res1->assertOk()->assertJsonPath('data.saved', true);

        $res2 = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/employee/saved-jobs/{$jobPost->id}/toggle");
        $res2->assertOk()->assertJsonPath('data.saved', false);
    }

    public function test_employer_cannot_access_employee_saved_jobs(): void
    {
        $employer = User::factory()->create(['role' => 'employer']);
        $this->actingAs($employer, 'sanctum')
            ->getJson('/api/v1/employee/saved-jobs')
            ->assertForbidden();
    }

    public function test_unauthenticated_cannot_access_saved_jobs(): void
    {
        $this->getJson('/api/v1/employee/saved-jobs')->assertUnauthorized();
    }
}
