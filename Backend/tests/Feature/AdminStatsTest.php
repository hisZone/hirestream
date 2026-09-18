<?php

namespace Tests\Feature;

use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_stats(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(3)->create(['role' => 'employee']);
        Employer::factory()->count(2)->create();
        JobPost::factory()->count(2)->create(['status' => 'published']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total_users',
                    'active_jobs',
                    'total_applications',
                    'total_companies',
                    'pending_job_approvals',
                    'pending_employer_approvals',
                    'jobs_approved',
                ],
            ]);
    }

    public function test_non_admin_cannot_view_stats(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/stats');

        $response->assertStatus(403);
    }
}
