<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_change_password(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $step1 = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $step1->assertOk()
            ->assertJsonFragment(['message' => __('passwords.otp_sent')]);

        $capturedCode = null;
        Mail::assertSent(OtpCodeMail::class, function ($mail) use (&$capturedCode) {
            $capturedCode = $mail->code;

            return true;
        });

        $step2 = $this->actingAs($user)
            ->postJson('/api/v1/confirm-change-password', [
                'code' => $capturedCode,
            ]);

        $step2->assertOk()
            ->assertJsonFragment(['message' => __('passwords.changed')]);

        $this->assertTrue(
            Hash::check('new-password', $user->fresh()->password)
        );
    }

    public function test_confirm_change_password_with_invalid_code_fails(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/confirm-change-password', [
                'code' => '000000',
            ]);

        $response->assertBadRequest();

        $this->assertTrue(
            Hash::check('old-password', $user->fresh()->password)
        );
    }

    public function test_change_password_requires_current_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_requires_new_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_change_password_requires_password_confirmation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_requires_min_8_characters(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
                'password' => 'short',
                'password_confirmation' => 'short',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_unauthenticated_user_cannot_change_password(): void
    {
        $response = $this->putJson('/api/v1/change-password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertUnauthorized();
    }

    public function test_change_password_revokes_all_tokens(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $user->createToken('test-token-1');
        $user->createToken('test-token-2');

        $this->assertEquals(2, $user->tokens()->count());

        $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $capturedCode = null;
        Mail::assertSent(OtpCodeMail::class, function ($mail) use (&$capturedCode) {
            $capturedCode = $mail->code;

            return true;
        });

        $response = $this->actingAs($user)
            ->postJson('/api/v1/confirm-change-password', [
                'code' => $capturedCode,
            ]);

        $response->assertOk();
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_change_password_fails_when_new_password_is_same_as_current_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('same-password'),
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/v1/change-password', [
                'current_password' => 'same-password',
                'password' => 'same-password',
                'password_confirmation' => 'same-password',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }
}
