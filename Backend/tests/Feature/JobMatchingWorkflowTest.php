<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\JobStatus;
use App\Enums\UserRole;
use App\Jobs\AnalyzeEmployeeJobMatchesJob;
use App\Jobs\AnalyzeJobPostMatchesJob;
use App\Models\EmployeeProfile;
use App\Models\Employer;
use App\Models\JobMatch;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employee\JobMatchNotification;
use App\Services\JobMatchingService;
use App\Services\JobPostWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class JobMatchingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_verifying_job_post_dispatches_matching_job(): void
    {
        Queue::fake();
        Notification::fake();

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'status' => JobStatus::PENDING_APPROVAL,
        ]);

        $workflowService = app(JobPostWorkflowService::class);
        $workflowService->approve($job);

        Queue::assertPushed(AnalyzeJobPostMatchesJob::class, function (AnalyzeJobPostMatchesJob $queuedJob) use ($job): bool {
            return $queuedJob->jobPost->id === $job->id;
        });
    }

    public function test_algorithmic_matching_service_identifies_matching_skills_and_calculates_score(): void
    {
        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Senior React & TypeScript Engineer',
            'requirements' => ['Strong proficiency in React', 'Experience with TypeScript', 'Tailwind CSS knowledge'],
            'responsibilities' => ['Build responsive UI', 'Collaborate with backend engineers'],
            'description' => 'Looking for an experienced React frontend developer.',
            'status' => JobStatus::PUBLISHED,
            'is_remote' => true,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        $profile = EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Frontend React Engineer',
            'skills' => ['React', 'TypeScript', 'Tailwind CSS', 'Redux'],
            'location' => 'Remote',
        ]);

        $service = new JobMatchingService();
        $result = $service->calculateMatch($job, $profile);

        $this->assertTrue($result['is_match']);
        $this->assertGreaterThanOrEqual(60, $result['score']);
        $this->assertContains('React', $result['reasons']['matched_skills']);
        $this->assertContains('TypeScript', $result['reasons']['matched_skills']);
    }

    public function test_background_worker_populates_job_matches_and_notifies_candidate(): void
    {
        Notification::fake();

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Full Stack Laravel Developer',
            'requirements' => ['PHP 8.2+', 'Laravel experience', 'Vue or React'],
            'responsibilities' => ['Develop REST APIs'],
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Full Stack Developer',
            'skills' => ['PHP', 'Laravel', 'MySQL'],
        ]);

        $workerJob = new AnalyzeJobPostMatchesJob($job);
        $workerJob->handle(app(JobMatchingService::class));

        $this->assertDatabaseHas('job_matches', [
            'user_id' => $candidate->id,
            'job_post_id' => $job->id,
        ]);

        Notification::assertSentTo(
            $candidate,
            JobMatchNotification::class,
            function (JobMatchNotification $notification) use ($job): bool {
                return $notification->jobPost->id === $job->id;
            }
        );
    }

    public function test_candidate_can_view_matched_job_feed(): void
    {
        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Python Backend Engineer',
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Python Developer',
            'skills' => ['Python', 'Django'],
        ]);

        JobMatch::create([
            'user_id' => $candidate->id,
            'job_post_id' => $job->id,
            'match_score' => 88,
            'match_reasons' => ['matched_skills' => ['Python']],
            'is_dismissed' => false,
        ]);

        $response = $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/v1/employee/feed');

        $response->assertOk()
            ->assertJsonPath('data.profile_status.is_complete', true)
            ->assertJsonPath('data.feed.0.match_score', 88)
            ->assertJsonPath('data.feed.0.job.title', 'Python Backend Engineer');
    }

    public function test_candidate_with_incomplete_profile_is_flagged_for_setup(): void
    {
        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        // No profile created yet

        $response = $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/v1/employee/profile');

        $response->assertOk()
            ->assertJsonPath('data.completion.is_complete', false);

        $missing = $response->json('data.completion.missing_fields');
        $this->assertContains('headline', $missing);
        $this->assertContains('skills', $missing);
    }

    public function test_candidate_updating_profile_triggers_background_matching_for_active_jobs(): void
    {
        Queue::fake();

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);

        $response = $this->actingAs($candidate, 'sanctum')
            ->putJson('/api/v1/employee/profile', [
                'headline' => 'Senior DevOps Engineer',
                'skills' => ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
                'location' => 'San Francisco',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.completion.is_complete', true)
            ->assertJsonPath('data.profile.headline', 'Senior DevOps Engineer');

        Queue::assertPushed(AnalyzeEmployeeJobMatchesJob::class, function (AnalyzeEmployeeJobMatchesJob $job) use ($candidate): bool {
            return $job->user->id === $candidate->id;
        });
    }

    public function test_candidate_can_dismiss_a_job_match(): void
    {
        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        JobMatch::create([
            'user_id' => $candidate->id,
            'job_post_id' => $job->id,
            'match_score' => 75,
            'is_dismissed' => false,
        ]);

        $response = $this->actingAs($candidate, 'sanctum')
            ->postJson("/api/v1/employee/feed/{$job->id}/dismiss");

        $response->assertOk();

        $this->assertDatabaseHas('job_matches', [
            'user_id' => $candidate->id,
            'job_post_id' => $job->id,
            'is_dismissed' => true,
        ]);
    }

    public function test_senior_backend_developer_matches_backend_developer_job_post_with_high_score(): void
    {
        $matchingService = app(JobMatchingService::class);

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Backend Developer',
            'description' => 'Looking for a solid backend developer to build scalable services.',
            'requirements' => ['Experience with server-side logic', 'Team player'],
            'status' => JobStatus::PUBLISHED,
            'is_remote' => true,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        $profile = EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Senior Backend Developer',
            'skills' => ['PHP', 'Laravel', 'PostgreSQL', 'Docker'],
        ]);

        $result = $matchingService->calculateMatch($job, $profile);

        $this->assertTrue($result['is_match'], 'Senior Backend Developer should match Backend Developer job');
        $this->assertGreaterThanOrEqual(80, $result['score'], 'Score should be at least 80% for direct core role match');
        $this->assertTrue($result['reasons']['is_core_match']);
        $this->assertEquals('Senior', $result['reasons']['seniority_alignment']);

        // Test running background worker on this job
        $worker = new AnalyzeJobPostMatchesJob($job);
        $worker->handle($matchingService);

        $this->assertDatabaseHas('job_matches', [
            'user_id' => $candidate->id,
            'job_post_id' => $job->id,
        ]);

        $match = JobMatch::where('user_id', $candidate->id)->where('job_post_id', $job->id)->first();
        $this->assertNotNull($match);
        $this->assertGreaterThanOrEqual(80, $match->match_score);
    }

    public function test_backend_engineer_matches_backend_developer_via_synonym_normalization(): void
    {
        $matchingService = app(JobMatchingService::class);

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Backend Developer',
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        $profile = EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Lead Server-Side Engineer',
            'skills' => ['Node.js', 'PostgreSQL'],
        ]);

        $result = $matchingService->calculateMatch($job, $profile);

        $this->assertTrue($result['is_match']);
        $this->assertGreaterThanOrEqual(75, $result['score']);
        $this->assertTrue($result['reasons']['is_core_match']);
    }

    public function test_work_experience_titles_are_considered_for_job_matching(): void
    {
        $matchingService = app(JobMatchingService::class);

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Backend Developer',
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        $profile = EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Consultant',
            'skills' => ['Architecture', 'Databases'],
            'experience' => [
                ['title' => 'Senior Backend Developer', 'company' => 'Acme Corp', 'years' => '3'],
            ],
        ]);

        $result = $matchingService->calculateMatch($job, $profile);

        $this->assertTrue($result['is_match']);
        $this->assertGreaterThanOrEqual(75, $result['score']);
    }

    public function test_opposing_domains_are_penalized_in_matching(): void
    {
        $matchingService = app(JobMatchingService::class);

        $employerUser = User::factory()->create(['role' => UserRole::EMPLOYER]);
        $employer = Employer::factory()->create(['user_id' => $employerUser->id]);
        $job = JobPost::factory()->create([
            'employer_id' => $employer->id,
            'title' => 'Backend Developer',
            'requirements' => ['Go', 'gRPC'],
            'status' => JobStatus::PUBLISHED,
        ]);

        $candidate = User::factory()->create(['role' => UserRole::EMPLOYEE]);
        $profile = EmployeeProfile::create([
            'user_id' => $candidate->id,
            'headline' => 'Frontend Developer',
            'skills' => ['React', 'CSS', 'HTML'],
        ]);

        $result = $matchingService->calculateMatch($job, $profile);

        $this->assertFalse($result['is_match']);
        $this->assertLessThan(35, $result['score']);
    }
}
