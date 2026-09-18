<?php

namespace App\Services;

use App\Mail\OtpCodeMail;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    private const CODE_LENGTH = 6;

    private const EXPIRY_MINUTES = 10;

    /**
     * Generate a new OTP code for the given user and purpose,
     * invalidate any previous unused codes for that purpose,
     * and email it to the user.
     */
    public function generateAndSend(User $user, string $purpose): Otp
    {
        // Invalidate any previous unused codes for this purpose
        Otp::query()
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->valid()
            ->update(['used_at' => now()]);

        $plainCode = (string) random_int(10 ** (self::CODE_LENGTH - 1), (10 ** self::CODE_LENGTH) - 1);

        $otp = Otp::create([
            'user_id' => $user->id,
            'code' => Hash::make($plainCode),
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
        ]);

        Mail::to($user->email)->send(new OtpCodeMail($plainCode, self::EXPIRY_MINUTES));

        return $otp;
    }

    /**
     * Verify a submitted OTP code for the given user and purpose.
     * On success, marks the code as used and returns true.
     */
    public function verify(User $user, string $purpose, string $submittedCode): bool
    {
        $otp = Otp::query()
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->valid()
            ->latest('id')
            ->first();

        if (! $otp || ! Hash::check($submittedCode, $otp->code)) {
            return false;
        }

        $otp->update(['used_at' => now()]);

        return true;
    }
}
