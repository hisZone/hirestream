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
use App\Notifications\V1\Admin\EmployerPendingApprovalNotification;
use App\Notifications\V1\Admin\JobSubmittedForReviewNotification;
use App\Services\JobPostWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $employerUser;

    private Employer $employer;

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
    }

    public function test_admin_can_view_notifications_list(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.data.company_name', 'Tech Corp')
            ->assertJsonPath('data.data.0.is_read', false);
    }

    public function test_admin_can_filter_unread_notifications(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        $notification = $this->admin->notifications()->first();
        $this->assertNotNull($notification);
        $notification->markAsRead();

        // Create second unread notification
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        // Filter unread
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/notifications?unread=1');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_admin_can_get_unread_count(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.unread_count', 2);
    }

    public function test_admin_can_mark_notification_as_read(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));
        $notification = $this->admin->notifications()->first();
        $this->assertNotNull($notification);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_read', true);

        $this->assertEquals(0, $this->admin->unreadNotifications()->count());
    }

    public function test_admin_can_mark_all_notifications_as_read(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        $this->assertEquals(2, $this->admin->unreadNotifications()->count());

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/notifications/mark-all-read');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(0, $this->admin->unreadNotifications()->count());
    }

    public function test_admin_can_delete_notification(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));
        $notification = $this->admin->notifications()->first();
        $this->assertNotNull($notification);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(0, $this->admin->notifications()->count());
    }

    public function test_non_admin_cannot_access_notifications(): void
    {
        $response = $this->actingAs($this->employerUser)
            ->getJson('/api/v1/admin/notifications');

        $response->assertStatus(403);
    }

    public function test_submitting_job_dispatches_notification_to_admins(): void
    {
        Notification::fake();

        $category = Category::create([
            'name' => 'IT & Software',
            'slug' => 'it-software',
        ]);

        $job = JobPost::create([
            'employer_id' => $this->employer->id,
            'category_id' => $category->id,
            'title' => 'Senior Backend Engineer',
            'slug' => 'senior-backend-engineer',
            'description' => 'A great job opportunity',
            'location' => 'Remote',
            'job_type' => JobType::FULL_TIME,
            'experience_level' => ExperienceLevel::SENIOR,
            'status' => JobStatus::DRAFT,
        ]);

        $service = app(JobPostWorkflowService::class);
        $service->submitForReview($job);

        Notification::assertSentTo(
            [$this->admin],
            JobSubmittedForReviewNotification::class
        );
    }

    public function test_creating_employer_dispatches_notification_to_admins(): void
    {
        Notification::fake();

        $newUser = User::factory()->create([
            'role' => UserRole::EMPLOYER,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($newUser)->postJson('/api/v1/employers', [
            'company_name' => 'NextGen Tech',
            'email' => 'contact@nextgen.com',
            'phone' => '+251911223399',
            'location' => 'Addis Ababa',
            'industry' => 'AI',
        ]);

        Notification::assertSentTo(
            [$this->admin],
            EmployerPendingApprovalNotification::class
        );
    }

    public function test_admin_can_connect_to_notification_stream(): void
    {
        $this->admin->notify(new EmployerPendingApprovalNotification($this->employer));

        $response = $this->actingAs($this->admin)
            ->get('/api/v1/admin/notifications/stream');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/event-stream', (string) $response->headers->get('Content-Type'));
    }
}
