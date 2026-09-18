<?php

declare(strict_types=1);

namespace App\Notifications\V1\Employer;

use App\Models\JobPost;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class JobPostRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public JobPost $jobPost,
        public string $reason
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
        return [
            'type' => 'job_post_rejected',
            'title' => 'Job Post Rejected',
            'message' => "Your job post '{$this->jobPost->title}' was rejected. Reason: {$this->reason}",
            'job_post_id' => $this->jobPost->id,
            'job_title' => $this->jobPost->title,
            'rejection_reason' => $this->reason,
            'action_url' => '/my-job-posts',
            'rejected_at' => now()->toIso8601String(),
        ];
    }
}
