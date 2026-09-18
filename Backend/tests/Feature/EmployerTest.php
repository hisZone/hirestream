<?php

namespace Tests\Feature;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployerTest extends TestCase
{
    use RefreshDatabase;

    public function test_employer_can_create_profile(): void
    {
        $user = User::factory()->create(['role' => 'employer']);

        $response = $this->actingAs($user)->postJson('/api/v1/employers', [
            'company_name' => 'Acme Corp',
            'description' => 'A great place to work',
            'website' => 'https://acme.com',
            'location' => 'Addis Ababa',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'company_name' => 'Acme Corp',
                    'user_id' => $user->id,
                ],
            ]);
    }

    public function test_job_seeker_cannot_create_employer_profile(): void
    {
        $user = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($user)->postJson('/api/v1/employers', [
            'company_name' => 'Acme Corp',
        ]);

        $response->assertStatus(403);
    }

    public function test_creating_employer_requires_company_name(): void
    {
        $user = User::factory()->create(['role' => 'employer']);

        $response = $this->actingAs($user)->postJson('/api/v1/employers', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['company_name']);
    }

    public function test_employer_can_view_own_profile(): void
    {
        $user = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson("/api/v1/employers/{$employer->id}");

        $response->assertStatus(200)
            ->assertJson(['data' => ['id' => $employer->id]]);
    }

    public function test_employer_can_update_own_profile(): void
    {
        $user = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/employers/{$employer->id}", ['company_name' => 'Updated Name']);

        $response->assertStatus(200)
            ->assertJson(['data' => ['company_name' => 'Updated Name']]);
    }

    public function test_user_cannot_update_someone_elses_employer_profile(): void
    {
        $employer = Employer::factory()->create();
        $otherUser = User::factory()->create(['role' => 'employer']);

        $response = $this->actingAs($otherUser)
            ->putJson("/api/v1/employers/{$employer->id}", ['company_name' => 'Hacked Name']);

        $response->assertStatus(403);
    }

    public function test_employer_can_delete_own_profile(): void
    {
        $user = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/v1/employers/{$employer->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('employers', ['id' => $employer->id]);
    }

    public function test_employer_can_get_my_profile(): void
    {
        $user = User::factory()->create(['role' => 'employer']);
        $employer = Employer::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/employer/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $employer->id,
                    'user_id' => $user->id,
                ],
            ]);
    }

    public function test_employer_can_update_my_profile_with_all_fields(): void
    {
        $user = User::factory()->create(['role' => 'employer']);

        $payload = [
            'company_name' => 'HireStream Tech',
            'email' => 'contact@hirestream.com',
            'phone' => '+251 911 234 567',
            'location' => 'Addis Ababa, Ethiopia',
            'website' => 'https://hirestream.com',
            'industry' => 'Technology',
            'company_size' => '51–200 employees',
            'description' => 'Leading digital solution provider',
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/employer/profile', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'company_name' => 'HireStream Tech',
                    'email' => 'contact@hirestream.com',
                    'phone' => '+251 911 234 567',
                    'location' => 'Addis Ababa, Ethiopia',
                    'industry' => 'Technology',
                    'company_size' => '51–200 employees',
                ],
            ]);

        $this->assertDatabaseHas('employers', [
            'user_id' => $user->id,
            'company_name' => 'HireStream Tech',
            'email' => 'contact@hirestream.com',
            'phone' => '+251 911 234 567',
            'industry' => 'Technology',
            'company_size' => '51–200 employees',
        ]);
    }
}
