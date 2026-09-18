<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedAuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Registration with Roles ────────────────────────────

    public function test_user_can_register_as_employee_by_default(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Jane Employee',
            'email' => 'employee@example.com',
            'username' => 'jane_emp',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'employee')
            ->assertJsonPath('user.role_label', 'Employee');

        $this->assertDatabaseHas('users', [
            'email' => 'employee@example.com',
            'role' => 'employee',
        ]);
    }

    public function test_user_can_register_as_employer(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Acme Corp',
            'email' => 'employer@example.com',
            'username' => 'acme_corp',
            'role' => 'employer',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'employer')
            ->assertJsonPath('user.role_label', 'Employer');

        $this->assertDatabaseHas('users', [
            'email' => 'employer@example.com',
            'role' => 'employer',
        ]);
    }

    public function test_user_cannot_self_register_as_admin(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Sneaky Admin',
            'email' => 'admin@example.com',
            'username' => 'sneaky_admin',
            'role' => 'admin',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'admin@example.com',
        ]);
    }

    // ─── Administrator Role Access Controls ────────────────

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Welcome Administrator']);
    }

    public function test_employer_cannot_access_admin_dashboard(): void
    {
        $employer = User::factory()->employer()->create();

        $response = $this->actingAs($employer)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertForbidden()
            ->assertJson(['success' => false]);
    }

    public function test_employee_cannot_access_admin_dashboard(): void
    {
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($employee)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertForbidden()
            ->assertJson(['success' => false]);
    }

    // ─── Employer Role Access Controls ─────────────────────

    public function test_employer_can_access_employer_dashboard(): void
    {
        $employer = User::factory()->employer()->create();

        $response = $this->actingAs($employer)
            ->getJson('/api/v1/employer/dashboard');

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Welcome Employer']);
    }

    public function test_employee_cannot_access_employer_dashboard(): void
    {
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($employee)
            ->getJson('/api/v1/employer/dashboard');

        $response->assertForbidden()
            ->assertJson(['success' => false]);
    }

    // ─── Employee Role Access Controls ─────────────────────

    public function test_employee_can_access_employee_dashboard(): void
    {
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($employee)
            ->getJson('/api/v1/employee/dashboard');

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Welcome Employee']);
    }

    // ─── Unauthenticated Access Controls ──────────────────

    public function test_unauthenticated_request_returns_unauthorized(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertUnauthorized();
    }
}
