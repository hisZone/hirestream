<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\Otp;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_verify_email(): void
    {
        Mail::fake();

        $user = User::factory()->unverified()->create();

        app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_REGISTER);

        $capturedCode = null;
        Mail::assertSent(OtpCodeMail::class, function ($mail) use (&$capturedCode) {
            $capturedCode = $mail->code;

            return true;
        });

        $response = $this->actingAs($user)
            ->postJson('/api/v1/email/verify-otp', ['code' => $capturedCode]);

        $response->assertOk()
            ->assertJsonFragment(['message' => __('auth.email_verified')]);

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_verify_email_with_invalid_code_returns_403(): void
    {
        $user = User::factory()->unverified()->create();

        app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_REGISTER);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/email/verify-otp', ['code' => '000000']);

        $response->assertForbidden()
            ->assertJsonFragment(['message' => __('auth.invalid_verification_link')]);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_verify_already_verified_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/email/verify-otp', ['code' => '000000']);

        $response->assertOk()
            ->assertJsonFragment(['message' => __('auth.email_already_verified')]);
    }

    public function test_authenticated_user_can_resend_verification_email(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/email/resend');

        $response->assertOk()
            ->assertJsonFragment(['message' => __('auth.email_sent')]);
    }

    public function test_verified_user_cannot_resend_verification(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/email/resend');

        $response->assertOk()
            ->assertJsonFragment(['message' => __('auth.email_already_verified')]);
    }

    public function test_unauthenticated_user_cannot_resend_verification(): void
    {
        $response = $this->postJson('/api/v1/email/resend');

        $response->assertUnauthorized();
    }

    public function test_unverified_user_cannot_access_protected_feature_routes(): void
    {
        $user = User::factory()->employee()->unverified()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/employee/dashboard');

        $response->assertForbidden();
    }
}
