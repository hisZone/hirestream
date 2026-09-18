<?php

declare(strict_types=1);

namespace App\Notifications\V1\Admin;

use App\Models\Employer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EmployerPendingApprovalNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Employer $employer
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
        return [
            'type' => 'employer_pending_approval',
            'title' => 'New Employer Awaiting Approval',
            'message' => "'{$this->employer->company_name}' submitted their company profile for review.",
            'employer_id' => $this->employer->id,
            'company_name' => $this->employer->company_name,
            'action_url' => '/admin/companies',
        ];
    }
}
