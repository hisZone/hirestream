<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Admin\EmployerPendingApprovalNotification;
use App\Notifications\V1\Admin\JobSubmittedForReviewNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;

class AdminNotificationService
{
    /**
     * Get all active administrators.
     *
     * @return Collection<int, User>
     */
    public function getActiveAdmins(): Collection
    {
        return User::where('role', UserRole::ADMIN)
            ->where('is_suspended', false)
            ->get();
    }

    /**
     * Notify administrators that a job post was submitted for review.
     */
    public function notifyJobSubmittedForReview(JobPost $jobPost): void
    {
        $admins = $this->getActiveAdmins();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new JobSubmittedForReviewNotification($jobPost));
        }
    }

    /**
     * Notify administrators that an employer submitted their profile for review.
     */
    public function notifyEmployerPendingApproval(Employer $employer): void
    {
        $admins = $this->getActiveAdmins();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new EmployerPendingApprovalNotification($employer));
        }
    }
}
