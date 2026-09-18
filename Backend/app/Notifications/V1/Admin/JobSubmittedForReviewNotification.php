<?php

declare(strict_types=1);

namespace App\Notifications\V1\Admin;

use App\Models\JobPost;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class JobSubmittedForReviewNotification extends Notification
{
    use Queueable;

    public function __construct(
        public JobPost $jobPost
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return list<string>
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
        $companyName = $this->jobPost->employer->company_name ?? 'An employer';

        return [
            'type' => 'job_submitted_for_review',
            'title' => 'New Job Submitted for Review',
            'message' => "'{$this->jobPost->title}' was submitted by {$companyName} and is awaiting review.",
            'job_post_id' => $this->jobPost->id,
            'job_title' => $this->jobPost->title,
            'company_name' => $companyName,
            'action_url' => '/admin/jobs',
        ];
    }
}
