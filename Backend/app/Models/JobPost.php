<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExperienceLevel;
use App\Enums\JobStatus;
use App\Enums\JobType;
use Database\Factories\JobPostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $employer_id
 * @property int $category_id
 * @property string $title
 * @property string $slug
 * @property string $description
 * @property array<int, string>|null $requirements
 * @property array<int, string>|null $responsibilities
 * @property JobType $job_type
 * @property ExperienceLevel $experience_level
 * @property string|null $location
 * @property int|null $salary_min
 * @property int|null $salary_max
 * @property string $salary_currency
 * @property bool $is_remote
 * @property JobStatus $status
 * @property string|null $rejection_reason
 * @property Carbon|null $published_at
 * @property Carbon|null $expires_at
 * @property int $views_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Employer|null $employer
 * @property-read Category|null $category
 */
class JobPost extends Model
{
    /** @use HasFactory<JobPostFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employer_id',
        'category_id',
        'title',
        'slug',
        'description',
        'requirements',
        'responsibilities',
        'job_type',
        'experience_level',
        'location',
        'salary_min',
        'salary_max',
        'salary_currency',
        'is_remote',
        'status',
        'rejection_reason',
        'published_at',
        'expires_at',
        'views_count',
    ];

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'responsibilities' => 'array',
            'is_remote' => 'boolean',
            'status' => JobStatus::class,
            'job_type' => JobType::class,
            'experience_level' => ExperienceLevel::class,
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'views_count' => 'integer',
            'salary_min' => 'integer',
            'salary_max' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (JobPost $job): void {
            if (empty($job->slug)) {
                $job->slug = Str::slug($job->title).'-'.Str::lower(Str::random(6));
            }
        });
    }

    /**
     * @return BelongsTo<Employer, $this>
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * @return HasMany<JobMatch, $this>
     */
    public function jobMatches(): HasMany
    {
        return $this->hasMany(JobMatch::class);
    }

    /**
     * Scope query to only include published and unexpired jobs.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', JobStatus::PUBLISHED)
            ->where(function (Builder $q): void {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope query for filtering job listings.
     *
     * @param  Builder<$this>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<$this>
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $q, string $search): void {
                $q->where(function (Builder $inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->when($filters['category_id'] ?? null, fn (Builder $q, $catId) => $q->where('category_id', $catId))
            ->when($filters['job_type'] ?? null, fn (Builder $q, $type) => $q->where('job_type', $type))
            ->when($filters['experience_level'] ?? null, fn (Builder $q, $exp) => $q->where('experience_level', $exp))
            ->when($filters['is_remote'] ?? null, fn (Builder $q, $remote) => $q->where('is_remote', filter_var($remote, FILTER_VALIDATE_BOOLEAN)))
            ->when($filters['location'] ?? null, fn (Builder $q, $loc) => $q->where('location', 'like', "%{$loc}%"))
            ->when($filters['salary_min'] ?? null, fn (Builder $q, $min) => $q->where('salary_max', '>=', $min))
            ->when($filters['salary_max'] ?? null, fn (Builder $q, $max) => $q->where('salary_min', '<=', $max));
    }
}
