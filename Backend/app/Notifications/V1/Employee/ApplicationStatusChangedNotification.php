<?php

declare(strict_types=1);

namespace App\Notifications\V1\Employee;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\JobPost;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApplicationStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Application $application,
        public JobPost $jobPost,
        public ApplicationStatus $status
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $statusLabel = match ($this->status) {
            ApplicationStatus::SUBMITTED => 'Submitted',
            ApplicationStatus::UNDER_REVIEW => 'Under Review',
            ApplicationStatus::SHORTLISTED => 'Shortlisted',
            ApplicationStatus::REJECTED => 'Rejected',
            ApplicationStatus::HIRED => 'Hired',
        };

        $companyName = $this->jobPost->employer->company_name ?? 'The employer';

        return [
            'type' => 'application_status_changed',
            'title' => 'Application Status Updated',
            'message' => "Your application for '{$this->jobPost->title}' at {$companyName} has been updated to {$statusLabel}.",
            'application_id' => $this->application->id,
            'job_post_id' => $this->jobPost->id,
            'job_title' => $this->jobPost->title,
            'company_name' => $companyName,
            'status' => $this->status->value,
            'status_label' => $statusLabel,
            'action_url' => '/my-applications',
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
