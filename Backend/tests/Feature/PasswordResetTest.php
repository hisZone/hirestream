<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_password_reset(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => __('passwords.sent')]);
    }

    public function test_forgot_password_with_invalid_email_returns_422(): void
    {
        $response = $this->postJson('/api/v1/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_requires_email(): void
    {
        $response = $this->postJson('/api/v1/forgot-password', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_requires_valid_email(): void
    {
        $response = $this->postJson('/api/v1/forgot-password', [
            'email' => 'not-an-email',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_reset_password_with_valid_code(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->postJson('/api/v1/forgot-password', ['email' => $user->email]);

        $capturedCode = null;
        Mail::assertSent(OtpCodeMail::class, function ($mail) use (&$capturedCode) {
            $capturedCode = $mail->code;

            return true;
        });

        $response = $this->postJson('/api/v1/reset-password', [
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => $capturedCode,
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => __('passwords.reset')]);

        $this->assertTrue(
            Hash::check('new-password', $user->fresh()->password)
        );
    }

    public function test_reset_password_with_invalid_code(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/forgot-password', ['email' => $user->email]);

        $response = $this->postJson('/api/v1/reset-password', [
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => '000000',
        ]);

        $response->assertBadRequest()
            ->assertJsonFragment(['message' => __('passwords.token')]);
    }

    public function test_reset_password_requires_code(): void
    {
        $response = $this->postJson('/api/v1/reset-password', [
            'email' => 'test@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_reset_password_requires_email(): void
    {
        $response = $this->postJson('/api/v1/reset-password', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => '123456',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_requires_password(): void
    {
        $response = $this->postJson('/api/v1/reset-password', [
            'email' => 'test@example.com',
            'code' => '123456',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_revokes_all_tokens(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $user->createToken('existing-token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->postJson('/api/v1/forgot-password', ['email' => $user->email]);

        $capturedCode = null;
        Mail::assertSent(OtpCodeMail::class, function ($mail) use (&$capturedCode) {
            $capturedCode = $mail->code;

            return true;
        });

        $this->postJson('/api/v1/reset-password', [
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => $capturedCode,
        ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
