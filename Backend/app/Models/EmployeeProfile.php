<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $headline
 * @property string|null $phone
 * @property string|null $location
 * @property string|null $bio
 * @property array<string>|null $skills
 * @property array<mixed>|null $experience
 * @property array<mixed>|null $education
 * @property array<mixed>|null $languages
 * @property string|null $preferred_job_type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
class EmployeeProfile extends Model
{
    protected $fillable = [
        'user_id',
        'headline',
        'phone',
        'location',
        'bio',
        'skills',
        'experience',
        'education',
        'languages',
        'preferred_job_type',
    ];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'experience' => 'array',
            'education' => 'array',
            'languages' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if profile has minimum necessary information for algorithmic recommendations.
     */
    public function isComplete(): bool
    {
        $hasHeadline = ! empty(trim($this->headline ?? ''));
        $hasSkills = is_array($this->skills) && count(array_filter($this->skills)) > 0;

        return $hasHeadline && $hasSkills;
    }
}
