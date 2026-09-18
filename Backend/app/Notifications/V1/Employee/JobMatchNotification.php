<?php

declare(strict_types=1);

namespace App\Notifications\V1\Employee;

use App\Models\JobPost;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class JobMatchNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $reasons
     */
    public function __construct(
        public JobPost $jobPost,
        public int $matchScore,
        public array $reasons = []
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
        $companyName = $this->jobPost->employer->company_name ?? 'An employer';
        $matchedSkills = (array) ($this->reasons['matched_skills'] ?? []);
        $skillsPreview = ! empty($matchedSkills)
            ? ' Matches your skills: ' . implode(', ', array_slice($matchedSkills, 0, 3)) . '.'
            : '';

        return [
            'type' => 'job_match',
            'title' => "New Job Match: {$this->matchScore}% Match",
            'message' => "We found a position matching your profile: '{$this->jobPost->title}' at {$companyName}.{$skillsPreview}",
            'job_post_id' => $this->jobPost->id,
            'job_title' => $this->jobPost->title,
            'job_slug' => $this->jobPost->slug,
            'company_name' => $companyName,
            'match_score' => $this->matchScore,
            'matched_skills' => $matchedSkills,
            'action_url' => "/jobs/{$this->jobPost->slug}",
            'created_at' => now()->toIso8601String(),
        ];
    }
}
