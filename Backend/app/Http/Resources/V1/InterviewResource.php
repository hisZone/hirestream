<?php

declare(strict_types=1);

namespace App\Http\Resources\V1;

use App\Models\Interview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Interview
 */
class InterviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'employer_id' => $this->employer_id,
            'user_id' => $this->user_id,
            'job_post_id' => $this->job_post_id,
            'title' => $this->title,
            'type' => $this->type,
            'scheduled_at' => $this->scheduled_at->toIso8601String(),
            'scheduled_at_formatted' => $this->scheduled_at->format('M d, Y h:i A'),
            'duration_minutes' => $this->duration_minutes,
            'timezone' => $this->timezone,
            'meeting_link' => $this->meeting_link,
            'location' => $this->location,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
