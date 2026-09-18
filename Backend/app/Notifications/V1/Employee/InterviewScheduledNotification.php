<?php

declare(strict_types=1);

namespace App\Notifications\V1\Employee;

use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InterviewScheduledNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Interview $interview,
        public bool $isReschedule = false
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
        $jobTitle = $this->interview->jobPost->title ?? 'Position';
        $companyName = $this->interview->employer->company_name ?? 'The employer';
        $scheduledAt = $this->interview->scheduled_at->format('M d, Y \a\t h:i A');

        $action = $this->isReschedule ? 'rescheduled' : 'scheduled';
        $title = $this->isReschedule ? 'Interview Rescheduled' : 'Interview Scheduled';

        return [
            'type' => $this->isReschedule ? 'interview_rescheduled' : 'interview_scheduled',
            'title' => $title,
            'message' => "Your interview for '{$jobTitle}' with {$companyName} has been {$action} for {$scheduledAt}.",
            'interview_id' => $this->interview->id,
            'application_id' => $this->interview->application_id,
            'job_post_id' => $this->interview->job_post_id,
            'job_title' => $jobTitle,
            'company_name' => $companyName,
            'scheduled_at' => $this->interview->scheduled_at->toIso8601String(),
            'scheduled_at_formatted' => $scheduledAt,
            'duration_minutes' => $this->interview->duration_minutes,
            'meeting_link' => $this->interview->meeting_link,
            'interview_type' => $this->interview->type,
            'action_url' => '/my-applications',
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
