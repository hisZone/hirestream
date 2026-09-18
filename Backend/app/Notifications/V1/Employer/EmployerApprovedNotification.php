<?php

declare(strict_types=1);

namespace App\Notifications\V1\Employer;

use App\Models\Employer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EmployerApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Employer $employer
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
            'type' => 'employer_approved',
            'title' => 'Company Profile Approved',
            'message' => "Congratulations! Your company profile for '{$this->employer->company_name}' has been approved by our admin team.",
            'employer_id' => $this->employer->id,
            'company_name' => $this->employer->company_name,
            'action_url' => '/company-profile',
            'approved_at' => now()->toIso8601String(),
        ];
    }
}
