<?php

declare(strict_types=1);

namespace App\Http\Resources\V1;

use App\Models\SavedJob;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SavedJob
 */
class SavedJobResource extends JsonResource
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
            'user_id' => $this->user_id,
            'job_post_id' => $this->job_post_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'created_at_human' => $this->created_at?->diffForHumans(),
            'job_post' => $this->jobPost ? new JobPostResource($this->jobPost) : null,
        ];
    }
}
