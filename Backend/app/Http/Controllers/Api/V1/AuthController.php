<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\V1\Auth\LoginRequest;
use App\Http\Requests\V1\Auth\RegisterRequest;
use App\Http\Requests\V1\Auth\ResetPasswordRequest;
use App\Http\Resources\V1\AuthResource;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\Otp;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\OtpService;
use Exception;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register User
     *
     * @unauthenticated
     *
     * @param  RegisterRequest  $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): AuthResource|JsonResponse
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'username' => $request->username,
                    'role' => $request->role,
                    'password' => Hash::make($request->password),
                ]);

                $token = $user->createAccessToken($request->boolean('remember_me'));

                app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_REGISTER);

                ActivityLogger::register($request);

                return AuthResource::make($user, $token);
            });
        } catch (Exception $e) {
            return $this->error(
                __('auth.register_error'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Login User
     *
     * @unauthenticated
     *
     * @param  LoginRequest  $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): AuthResource|JsonResponse
    {
        $user = $request->authenticate();

        $token = $user->createAccessToken($request->boolean('remember_me'));

        ActivityLogger::login($request);

        return AuthResource::make($user, $token);
    }

    /**
     * Logout User
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke token
        $request->user()->currentAccessToken()->delete();

        ActivityLogger::logout($request);

        return $this->success(null, __('auth.logout'));
    }

    /**
     * Change Password (Step 1) - validates current password, sends OTP
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', 'min:8', 'different:current_password'],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => __('auth.failed'),
            ]);
        }

        // Stash the pending new password (hashed) until the OTP is confirmed
        cache()->put(
            "pending_password_change:{$user->id}",
            Hash::make($request->password),
            now()->addMinutes(10)
        );

        app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_CHANGE_PASSWORD);

        return $this->success(null, __('passwords.otp_sent'));
    }

    /**
     * Change Password (Step 2) - verifies OTP and applies the pending change
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function confirmChangePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate(['code' => ['required', 'string']]);

        $cacheKey = "pending_password_change:{$user->id}";
        $pendingHash = cache()->get($cacheKey);

        if (! $pendingHash) {
            return $this->error(__('passwords.no_pending_change'), 400);
        }

        if (! app(OtpService::class)->verify($user, Otp::PURPOSE_CHANGE_PASSWORD, $request->string('code')->value())) {
            return $this->error(__('passwords.token'), 400);
        }

        $user->password = $pendingHash;
        $user->save();
        $user->tokens()->delete();

        cache()->forget($cacheKey);

        ActivityLogger::passwordChanged($request);

        return $this->success(null, __('passwords.changed'));
    }

    /**
     * Get User
     *
     * @param  Request  $request
     * @return UserResource
     */
    public function profile(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    /**
     * Verify Email
     *
     * @return JsonResponse
     */
    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate(['code' => ['required', 'string']]);

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, __('auth.email_already_verified'));
        }

        if (! app(OtpService::class)->verify($user, Otp::PURPOSE_REGISTER, $request->string('code')->value())) {
            return $this->forbidden(__('auth.invalid_verification_link'));
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        ActivityLogger::emailVerified($user, request());

        return $this->success(null, __('auth.email_verified'));
    }

    /**
     * Resend Verification OTP
     *
     * @return JsonResponse
     */
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, __('auth.email_already_verified'));
        }

        app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_REGISTER);

        return $this->success(null, __('auth.email_sent'));
    }

    /**
     * Forgot Password
     *
     * @param  ForgotPasswordRequest  $request
     * @return JsonResponse
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            $user = User::where('email', $request->email)->firstOrFail();

            app(OtpService::class)->generateAndSend($user, Otp::PURPOSE_PASSWORD_RESET);

            return $this->success(null, __('passwords.sent'));
        } catch (Exception $e) {
            return $this->error(
                __('passwords.unable_to_send_reset'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Reset Password
     *
     * @param  ResetPasswordRequest  $request
     * @return JsonResponse
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return $this->error(__('passwords.user'), 404);
            }

            if (! app(OtpService::class)->verify($user, Otp::PURPOSE_PASSWORD_RESET, $request->string('code')->value())) {
                return $this->error(__('passwords.token'), 400);
            }

            $user->forceFill([
                'password' => Hash::make($request->password),
            ])->save();

            $user->tokens()->delete();

            event(new PasswordReset($user));

            ActivityLogger::passwordReset();

            return $this->success(null, __('passwords.reset'));
        } catch (Exception $e) {
            return $this->error(
                __('passwords.unable_to_reset_password'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }
}
