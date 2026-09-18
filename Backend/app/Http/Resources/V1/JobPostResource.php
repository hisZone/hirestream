<?php

declare(strict_types=1);

namespace App\Http\Resources\V1;

use App\Enums\JobStatus;
use App\Models\JobPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin JobPost
 */
class JobPostResource extends JsonResource
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
            'employer_id' => $this->employer_id,
            'category_id' => $this->category_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'requirements' => $this->requirements ?? [],
            'responsibilities' => $this->responsibilities ?? [],
            'job_type' => $this->job_type->value,
            'job_type_label' => $this->job_type->label(),
            'experience_level' => $this->experience_level->value,
            'experience_level_label' => $this->experience_level->label(),
            'location' => $this->location,
            'salary_min' => $this->salary_min,
            'salary_max' => $this->salary_max,
            'salary_currency' => $this->salary_currency,
            'is_remote' => $this->is_remote,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'rejection_reason' => $this->when($this->status === JobStatus::REJECTED, $this->rejection_reason),
            'published_at' => $this->published_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'views_count' => $this->views_count,
            'applications_count' => $this->applications_count ?? 0,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'employer' => $this->whenLoaded('employer', fn () => [
                'id' => $this->employer->id,
                'company_name' => $this->employer->company_name,
                'logo' => $this->employer->logo,
                'website' => $this->employer->website,
                'location' => $this->employer->location,
            ]),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
        ];
    }
}
