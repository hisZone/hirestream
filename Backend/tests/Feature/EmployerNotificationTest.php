<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ExperienceLevel;
use App\Enums\JobStatus;
use App\Enums\JobType;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employer\EmployerApprovedNotification;
use App\Notifications\V1\Employer\EmployerRejectedNotification;
use App\Notifications\V1\Employer\JobPostApprovedNotification;
use App\Notifications\V1\Employer\JobPostRejectedNotification;
use App\Notifications\V1\Employer\NewApplicationReceivedNotification;
use App\Services\JobPostWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EmployerNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $employerUser;

    private Employer $employer;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => UserRole::ADMIN,
            'email_verified_at' => now(),
        ]);

        $this->employerUser = User::factory()->create([
            'role' => UserRole::EMPLOYER,
            'email_verified_at' => now(),
        ]);

        $this->employer = Employer::create([
            'user_id' => $this->employerUser->id,
            'company_name' => 'Tech Corp',
            'email' => 'tech@corp.com',
            'phone' => '+251911223344',
            'location' => 'Addis Ababa',
            'industry' => 'Software',
            'approval_status' => 'pending',
        ]);

        $this->category = Category::create([
            'name' => 'Engineering',
            'slug' => 'engineering',
        ]);
    }

    public function test_employer_can_view_notifications_list(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));

        $response = $this->actingAs($this->employerUser)
            ->getJson('/api/v1/employer/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.data.company_name', 'Tech Corp')
            ->assertJsonPath('data.data.0.is_read', false);
    }

    public function test_employer_can_filter_unread_notifications(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));

        $notification = $this->employerUser->notifications()->first();
        $this->assertNotNull($notification);
        $notification->markAsRead();

        // Second notification (unread)
        $this->employerUser->notify(new EmployerRejectedNotification($this->employer));

        $response = $this->actingAs($this->employerUser)
            ->getJson('/api/v1/employer/notifications?unread=1');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.data.type', 'employer_rejected');
    }

    public function test_employer_can_get_unread_count(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));
        $this->employerUser->notify(new EmployerRejectedNotification($this->employer));

        $response = $this->actingAs($this->employerUser)
            ->getJson('/api/v1/employer/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.unread_count', 2);
    }

    public function test_employer_can_mark_notification_as_read(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));
        $notification = $this->employerUser->notifications()->first();
        $this->assertNotNull($notification);

        $response = $this->actingAs($this->employerUser)
            ->patchJson("/api/v1/employer/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_read', true);

        $this->assertEquals(0, $this->employerUser->unreadNotifications()->count());
    }

    public function test_employer_can_mark_all_notifications_as_read(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));
        $this->employerUser->notify(new EmployerRejectedNotification($this->employer));

        $this->assertEquals(2, $this->employerUser->unreadNotifications()->count());

        $response = $this->actingAs($this->employerUser)
            ->postJson('/api/v1/employer/notifications/mark-all-read');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(0, $this->employerUser->unreadNotifications()->count());
    }

    public function test_employer_can_delete_notification(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));
        $notification = $this->employerUser->notifications()->first();
        $this->assertNotNull($notification);

        $response = $this->actingAs($this->employerUser)
            ->deleteJson("/api/v1/employer/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(0, $this->employerUser->notifications()->count());
    }

    public function test_non_employer_cannot_access_employer_notifications(): void
    {
        $employeeUser = User::factory()->create([
            'role' => UserRole::EMPLOYEE,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($employeeUser)
            ->getJson('/api/v1/employer/notifications');

        $response->assertStatus(403);
    }

    public function test_approving_job_post_notifies_employer(): void
    {
        Notification::fake();

        $job = JobPost::create([
            'employer_id' => $this->employer->id,
            'category_id' => $this->category->id,
            'title' => 'Software Architect',
            'slug' => 'software-architect',
            'description' => 'Great role',
            'location' => 'Addis Ababa',
            'job_type' => JobType::FULL_TIME,
            'experience_level' => ExperienceLevel::SENIOR,
            'status' => JobStatus::PENDING_APPROVAL,
        ]);

        $service = app(JobPostWorkflowService::class);
        $service->approve($job);

        Notification::assertSentTo(
            [$this->employerUser],
            JobPostApprovedNotification::class
        );
    }

    public function test_rejecting_job_post_notifies_employer(): void
    {
        Notification::fake();

        $job = JobPost::create([
            'employer_id' => $this->employer->id,
            'category_id' => $this->category->id,
            'title' => 'QA Tester',
            'slug' => 'qa-tester',
            'description' => 'Great role',
            'location' => 'Remote',
            'job_type' => JobType::FULL_TIME,
            'experience_level' => ExperienceLevel::ENTRY,
            'status' => JobStatus::PENDING_APPROVAL,
        ]);

        $service = app(JobPostWorkflowService::class);
        $service->reject($job, 'Incomplete job description');

        Notification::assertSentTo(
            [$this->employerUser],
            JobPostRejectedNotification::class
        );
    }

    public function test_approving_company_profile_notifies_employer(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/companies/{$this->employer->id}/approve");

        $response->assertStatus(200);

        Notification::assertSentTo(
            [$this->employerUser],
            EmployerApprovedNotification::class
        );
    }

    public function test_rejecting_company_profile_notifies_employer(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/companies/{$this->employer->id}/reject");

        $response->assertStatus(200);

        Notification::assertSentTo(
            [$this->employerUser],
            EmployerRejectedNotification::class
        );
    }

    public function test_applicant_applying_for_job_notifies_employer(): void
    {
        Notification::fake();
        Storage::fake('local');

        $job = JobPost::create([
            'employer_id' => $this->employer->id,
            'category_id' => $this->category->id,
            'title' => 'Frontend Developer',
            'slug' => 'frontend-developer',
            'description' => 'React dev needed',
            'location' => 'Remote',
            'job_type' => JobType::FULL_TIME,
            'experience_level' => ExperienceLevel::MID,
            'status' => JobStatus::PUBLISHED,
        ]);

        $cvPath = UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf')->store('cvs', 'local');

        $employeeUser = User::factory()->create([
            'role' => UserRole::EMPLOYEE,
            'email_verified_at' => now(),
            'cv_path' => $cvPath,
        ]);

        $response = $this->actingAs($employeeUser)->postJson("/api/v1/jobs/{$job->id}/apply", [
            'cover_letter' => 'I am very interested in this role.',
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo(
            [$this->employerUser],
            NewApplicationReceivedNotification::class
        );
    }

    public function test_employer_can_connect_to_notification_stream(): void
    {
        $this->employerUser->notify(new EmployerApprovedNotification($this->employer));

        $response = $this->actingAs($this->employerUser)
            ->get('/api/v1/employer/notifications/stream');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/event-stream', (string) $response->headers->get('Content-Type'));
    }
}
