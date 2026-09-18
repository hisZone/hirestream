<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApplicationManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private JobPost $jobPost;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $employerUser = User::factory()->create(['role' => 'employer', 'email_verified_at' => now()]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id, 'company_name' => 'Tech Corp']);

        $category = Category::factory()->create();

        $this->jobPost = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'category_id' => $category->id,
            'title' => 'Senior Frontend Developer',
        ]);
    }

    public function test_admin_can_list_applications_with_filters(): void
    {
        $applicant1 = User::factory()->create(['role' => 'employee']);
        $applicant2 = User::factory()->create(['role' => 'employee']);

        Application::factory()->create([
            'user_id' => $applicant1->id,
            'job_post_id' => $this->jobPost->id,
            'status' => 'submitted',
        ]);

        Application::factory()->create([
            'user_id' => $applicant2->id,
            'job_post_id' => $this->jobPost->id,
            'status' => 'shortlisted',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/applications?status=shortlisted');

        $response->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.status', 'shortlisted');
    }

    public function test_admin_can_search_applications(): void
    {
        $applicant = User::factory()->create([
            'name' => 'Abel Tesfaye',
            'email' => 'abel@example.com',
            'role' => 'employee',
        ]);

        Application::factory()->create([
            'user_id' => $applicant->id,
            'job_post_id' => $this->jobPost->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/applications?search=Abel');

        $response->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.applicant.name', 'Abel Tesfaye');
    }

    public function test_admin_can_update_application_status(): void
    {
        $applicant = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'user_id' => $applicant->id,
            'job_post_id' => $this->jobPost->id,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/admin/applications/{$application->id}/status", [
                'status' => 'under_review',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'under_review');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'under_review',
        ]);
    }

    public function test_admin_can_delete_application(): void
    {
        $applicant = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'user_id' => $applicant->id,
            'job_post_id' => $this->jobPost->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/applications/{$application->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('applications', [
            'id' => $application->id,
        ]);
    }

    public function test_non_admin_cannot_access_admin_applications(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/applications');

        $response->assertStatus(403);
    }
}
