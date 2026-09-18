<?php

namespace Tests\Feature\Api\V1;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employee\ApplicationStatusChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_own_applications(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        Application::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/employee/applications');

        $response->assertOk()
            ->assertJsonCount(2, 'data.data');
    }

    public function test_employer_can_view_applicants_for_own_job(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        Application::factory()->count(3)->create(['job_post_id' => $jobPost->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/jobs/{$jobPost->id}/applicants");

        $response->assertOk()
            ->assertJsonCount(3, 'data.data')
            ->assertJsonPath('data.counts.all', 3);
    }

    public function test_employer_can_filter_applicants_by_status_and_search(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);

        $applicantJohn = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $applicantJane = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicantJohn->id,
            'status' => ApplicationStatus::SUBMITTED,
        ]);
        Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicantJane->id,
            'status' => ApplicationStatus::HIRED,
        ]);

        // Filter by status 'hired'
        $statusResponse = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/jobs/{$jobPost->id}/applicants?status=hired");

        $statusResponse->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.status', 'hired')
            ->assertJsonPath('data.counts.all', 2)
            ->assertJsonPath('data.counts.submitted', 1)
            ->assertJsonPath('data.counts.hired', 1)
            ->assertJsonPath('data.counts.under_review', 0)
            ->assertJsonPath('data.counts.shortlisted', 0)
            ->assertJsonPath('data.counts.rejected', 0);

        // Filter by search 'John'
        $searchResponse = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/jobs/{$jobPost->id}/applicants?search=John");

        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.applicant.name', 'John Doe');
    }

    public function test_employer_cannot_view_applicants_for_others_job(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        Employer::factory()->create(['user_id' => $employerUser->id]);

        $otherEmployer = Employer::factory()->create();
        $jobPost = JobPost::factory()->create(['employer_id' => $otherEmployer->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/jobs/{$jobPost->id}/applicants");

        $response->assertStatus(403);
    }

    public function test_employer_can_view_single_application_detail(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $applicant = User::factory()->create(['name' => 'Candidate One']);
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicant->id,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/applications/{$application->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.applicant.name', 'Candidate One');
    }

    public function test_employer_cannot_view_application_detail_for_others_job(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        Employer::factory()->create(['user_id' => $employerUser->id]);

        $otherEmployer = Employer::factory()->create();
        $jobPost = JobPost::factory()->create(['employer_id' => $otherEmployer->id]);
        $application = Application::factory()->create(['job_post_id' => $jobPost->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/applications/{$application->id}");

        $response->assertStatus(403);
    }

    public function test_employer_can_update_application_status(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $applicant = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicant->id,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'shortlisted',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'shortlisted',
        ]);

        Notification::assertSentTo($applicant, ApplicationStatusChangedNotification::class);
    }

    public function test_employer_can_hire_applicant(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $applicant = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicant->id,
            'status' => ApplicationStatus::UNDER_REVIEW,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'hired',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'hired')
            ->assertJsonPath('data.status_label', 'Hired');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'hired',
        ]);

        Notification::assertSentTo($applicant, ApplicationStatusChangedNotification::class);
    }

    public function test_employer_can_reject_applicant(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $applicant = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $applicant->id,
            'status' => ApplicationStatus::UNDER_REVIEW,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'rejected',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.status_label', 'Rejected');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'rejected',
        ]);

        Notification::assertSentTo($applicant, ApplicationStatusChangedNotification::class);
    }

    public function test_employer_cannot_update_status_with_invalid_value(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $application = Application::factory()->create(['job_post_id' => $jobPost->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'invalid_status_value',
            ]);

        $response->assertStatus(422);
    }

    public function test_employer_cannot_update_status_for_others_job(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        Employer::factory()->create(['user_id' => $employerUser->id]);

        $otherEmployer = Employer::factory()->create();
        $jobPost = JobPost::factory()->create(['employer_id' => $otherEmployer->id]);
        $application = Application::factory()->create(['job_post_id' => $jobPost->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'hired',
            ]);

        $response->assertStatus(403);
    }

    public function test_employer_can_download_applicant_cv(): void
    {
        Storage::fake('local');

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);

        Storage::disk('local')->put('cvs/applications/test.pdf', 'fake pdf content');
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'cv_path' => 'cvs/applications/test.pdf',
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/applications/{$application->id}/cv");

        $response->assertOk();
    }

    public function test_employer_cannot_download_cv_for_others_application(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        Employer::factory()->create(['user_id' => $employerUser->id]);

        $otherEmployer = Employer::factory()->create();
        $jobPost = JobPost::factory()->create(['employer_id' => $otherEmployer->id]);
        $application = Application::factory()->create(['job_post_id' => $jobPost->id]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/applications/{$application->id}/cv");

        $response->assertStatus(403);
    }

    public function test_download_cv_returns_404_when_file_not_found(): void
    {
        Storage::fake('local');

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'cv_path' => 'nonexistent/path/test.pdf',
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->getJson("/api/v1/employer/applications/{$application->id}/cv");

        $response->assertStatus(404);
    }
}
