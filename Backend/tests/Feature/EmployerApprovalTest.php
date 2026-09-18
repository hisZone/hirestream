<?php

namespace Tests\Feature;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployerApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_pending_employers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Employer::factory()->count(2)->create(['approval_status' => 'pending']);
        Employer::factory()->create(['approval_status' => 'approved']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/employers/pending');

        $response->assertOk();
        $response->assertJsonCount(2, 'data.data');
    }

    public function test_non_admin_cannot_list_pending_employers(): void
    {
        $user = User::factory()->create(['role' => 'employer']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/employers/pending');

        $response->assertForbidden();
    }

    public function test_admin_can_approve_employer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employer = Employer::factory()->create(['approval_status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/employers/{$employer->id}/approval-status", [
                'approval_status' => 'approved',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('employers', [
            'id' => $employer->id,
            'approval_status' => 'approved',
        ]);
    }

    public function test_admin_can_reject_employer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employer = Employer::factory()->create(['approval_status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/employers/{$employer->id}/approval-status", [
                'approval_status' => 'rejected',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('employers', [
            'id' => $employer->id,
            'approval_status' => 'rejected',
        ]);
    }

    public function test_non_admin_cannot_update_approval_status(): void
    {
        $user = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['approval_status' => 'pending']);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/employers/{$employer->id}/approval-status", [
                'approval_status' => 'approved',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('employers', [
            'id' => $employer->id,
            'approval_status' => 'pending',
        ]);
    }

    public function test_invalid_approval_status_value_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employer = Employer::factory()->create(['approval_status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/employers/{$employer->id}/approval-status", [
                'approval_status' => 'not-a-real-status',
            ]);

        $response->assertStatus(422);
    }

    public function test_new_employer_defaults_to_pending(): void
    {
        $employer = Employer::factory()->create();
        $employer->refresh();

        $this->assertEquals('pending', $employer->approval_status);
    }
}
