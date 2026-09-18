<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Application;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class ScheduleInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasRole(UserRole::EMPLOYER);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:video,in_person,phone'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'meeting_link' => ['nullable', 'string', 'url', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
