<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $job_post_id
 * @property int $match_score
 * @property array<string, mixed>|null $match_reasons
 * @property bool $is_dismissed
 * @property bool $is_viewed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read JobPost $jobPost
 */
class JobMatch extends Model
{
    protected $fillable = [
        'user_id',
        'job_post_id',
        'match_score',
        'match_reasons',
        'is_dismissed',
        'is_viewed',
    ];

    protected function casts(): array
    {
        return [
            'match_score' => 'integer',
            'match_reasons' => 'array',
            'is_dismissed' => 'boolean',
            'is_viewed' => 'boolean',
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
     * @return BelongsTo<JobPost, $this>
     */
    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }
}
