<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class ActivityLogger
{
    protected static string $channel = 'activity';

    /**
     * @param  array<string, mixed>  $extra
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?Request $request = null,
        ?array $extra = []
    ): void {
        $data = array_merge([
            'action' => $action,
            'description' => $description,
            'user_id' => Auth::id(),
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ], $extra);

        try {
            Log::channel(self::$channel)->info($description ?? $action, $data);
        } catch (Throwable) {
            // Fallback to default application logger if activity channel is not writable
            Log::info($description ?? $action, $data);
        }
    }

    public static function auth(string $action, ?Request $request = null): void
    {
        self::log($action, "User {$action}", $request);
    }

    public static function login(?Request $request = null): void
    {
        self::auth('login', $request);
    }

    public static function logout(?Request $request = null): void
    {
        self::auth('logout', $request);
    }

    public static function register(?Request $request = null): void
    {
        self::auth('register', $request);
    }

    public static function passwordChanged(?Request $request = null): void
    {
        self::auth('password_changed', $request);
    }

    public static function passwordReset(?Request $request = null): void
    {
        self::auth('password_reset', $request);
    }

    public static function emailVerified(?User $user = null, ?Request $request = null): void
    {
        $extra = $user ? ['user_id' => $user->id] : [];
        self::log('email_verified', 'User email_verified', $request, $extra);
    }
}
