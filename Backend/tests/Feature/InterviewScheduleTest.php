<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\Employer;
use App\Models\Interview;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employee\ApplicationStatusChangedNotification;
use App\Notifications\V1\Employee\InterviewScheduledNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InterviewScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_employer_can_schedule_interview_for_shortlisted_applicant(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $candidate = User::factory()->create(['role' => 'employee']);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        $scheduledAt = Carbon::now()->addDays(3)->setHour(14)->setMinute(0)->setSecond(0);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->postJson("/api/v1/employer/applications/{$application->id}/interview", [
                'title' => 'Technical Interview',
                'type' => 'video',
                'scheduled_at' => $scheduledAt->toIso8601String(),
                'duration_minutes' => 45,
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
                'notes' => 'Please bring your portfolio and prepare for architecture questions.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Technical Interview')
            ->assertJsonPath('data.type', 'video')
            ->assertJsonPath('data.meeting_link', 'https://meet.google.com/abc-defg-hij')
            ->assertJsonPath('data.duration_minutes', 45);

        $this->assertDatabaseHas('interviews', [
            'application_id' => $application->id,
            'user_id' => $candidate->id,
            'employer_id' => $employer->id,
            'title' => 'Technical Interview',
            'type' => 'video',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
        ]);

        Notification::assertSentTo($candidate, InterviewScheduledNotification::class);
    }

    public function test_scheduling_interview_for_submitted_applicant_auto_shortlists_them(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $candidate = User::factory()->create(['role' => 'employee']);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SUBMITTED,
        ]);

        $scheduledAt = Carbon::now()->addDays(2)->setHour(10)->setMinute(0);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->postJson("/api/v1/employer/applications/{$application->id}/interview", [
                'type' => 'video',
                'scheduled_at' => $scheduledAt->toIso8601String(),
                'duration_minutes' => 30,
            ]);

        $response->assertOk();

        $this->assertEquals(ApplicationStatus::SHORTLISTED, $application->fresh()->status);
        Notification::assertSentTo($candidate, ApplicationStatusChangedNotification::class);
        Notification::assertSentTo($candidate, InterviewScheduledNotification::class);
    }

    public function test_employer_can_reschedule_interview(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $candidate = User::factory()->create(['role' => 'employee']);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        Interview::factory()->create([
            'application_id' => $application->id,
            'employer_id' => $employer->id,
            'user_id' => $candidate->id,
            'job_post_id' => $jobPost->id,
            'scheduled_at' => Carbon::now()->addDay(),
        ]);

        $newDate = Carbon::now()->addDays(5)->setHour(15)->setMinute(30);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->postJson("/api/v1/employer/applications/{$application->id}/interview", [
                'title' => 'Rescheduled Round 2',
                'type' => 'phone',
                'scheduled_at' => $newDate->toIso8601String(),
                'duration_minutes' => 30,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Rescheduled Round 2')
            ->assertJsonPath('data.type', 'phone');

        $this->assertDatabaseCount('interviews', 1);

        Notification::assertSentTo($candidate, function (InterviewScheduledNotification $notification) {
            return $notification->isReschedule === true;
        });
    }

    public function test_employer_can_cancel_interview(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $candidate = User::factory()->create(['role' => 'employee']);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        Interview::factory()->create([
            'application_id' => $application->id,
            'employer_id' => $employer->id,
            'user_id' => $candidate->id,
            'job_post_id' => $jobPost->id,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->deleteJson("/api/v1/employer/applications/{$application->id}/interview");

        $response->assertOk();
        $this->assertDatabaseMissing('interviews', ['application_id' => $application->id]);
    }

    public function test_employer_cannot_schedule_interview_for_another_employers_applicant(): void
    {
        $employer1User = User::factory()->create(['role' => 'employer']);
        Employer::factory()->create(['user_id' => $employer1User->id]);

        $employer2User = User::factory()->create(['role' => 'employer']);
        $employer2 = Employer::factory()->create(['user_id' => $employer2User->id]);
        $jobPost2 = JobPost::factory()->create(['employer_id' => $employer2->id]);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost2->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        $response = $this->actingAs($employer1User, 'sanctum')
            ->postJson("/api/v1/employer/applications/{$application->id}/interview", [
                'type' => 'video',
                'scheduled_at' => Carbon::now()->addDays(2)->toIso8601String(),
                'duration_minutes' => 45,
            ]);

        $response->assertForbidden();
    }

    public function test_schedule_interview_requires_future_date(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        $response = $this->actingAs($employerUser, 'sanctum')
            ->postJson("/api/v1/employer/applications/{$application->id}/interview", [
                'type' => 'video',
                'scheduled_at' => Carbon::now()->subDay()->toIso8601String(),
                'duration_minutes' => 45,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_employee_can_view_scheduled_interview(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);
        $candidate = User::factory()->create(['role' => 'employee']);

        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        $scheduledAt = Carbon::now()->addDays(2);
        Interview::factory()->create([
            'application_id' => $application->id,
            'employer_id' => $employer->id,
            'user_id' => $candidate->id,
            'job_post_id' => $jobPost->id,
            'title' => 'Initial Call',
            'scheduled_at' => $scheduledAt,
        ]);

        $response = $this->actingAs($candidate, 'sanctum')
            ->getJson("/api/v1/employee/applications/{$application->id}/interview");

        $response->assertOk()
            ->assertJsonPath('data.title', 'Initial Call');

        // Also verify interview is nested in employee's applications index
        $indexResponse = $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/v1/employee/applications');

        $indexResponse->assertOk()
            ->assertJsonPath('data.data.0.interview.title', 'Initial Call');
    }

    public function test_employer_can_update_applicant_status_while_interview_is_scheduled(): void
    {
        $employerUser = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $jobPost = JobPost::factory()->create(['employer_id' => $employer->id]);

        $candidate = User::factory()->create(['role' => 'employee']);
        $application = Application::factory()->create([
            'job_post_id' => $jobPost->id,
            'user_id' => $candidate->id,
            'status' => ApplicationStatus::SHORTLISTED,
        ]);

        $interview = Interview::factory()->create([
            'application_id' => $application->id,
            'employer_id' => $employer->id,
            'user_id' => $application->user_id,
            'job_post_id' => $jobPost->id,
            'status' => 'scheduled',
        ]);

        // Test PATCH update to hired
        $response = $this->actingAs($employerUser, 'sanctum')
            ->patchJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'hired',
            ]);

        $response->assertOk();
        $this->assertEquals(ApplicationStatus::HIRED, $application->fresh()->status);
        $this->assertEquals('completed', $interview->fresh()->status);

        // Test PUT update to rejected
        $response2 = $this->actingAs($employerUser, 'sanctum')
            ->putJson("/api/v1/employer/applications/{$application->id}/status", [
                'status' => 'rejected',
            ]);

        $response2->assertOk();
        $this->assertEquals(ApplicationStatus::REJECTED, $application->fresh()->status);
        $this->assertEquals('cancelled', $interview->fresh()->status);
    }
}
