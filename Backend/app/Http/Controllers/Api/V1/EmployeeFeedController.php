<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\JobPostResource;
use App\Http\Traits\ApiResponse;
use App\Models\JobMatch;
use App\Models\JobPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeFeedController extends Controller
{
    use ApiResponse;

    /**
     * Display the employee's personalized job match recommendations feed.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->employeeProfile;
        $isComplete = $profile?->isComplete() ?? false;

        $savedJobIds = $user->savedJobs()->pluck('job_post_id')->all();
        $appliedJobIds = $user->applications()->pluck('job_post_id')->all();

        $query = JobMatch::query()
            ->where('user_id', $user->id)
            ->where('is_dismissed', false)
            ->whereHas('jobPost', function (Builder $q): void {
                $q->where('status', JobStatus::PUBLISHED)
                    ->where(function (Builder $sub): void {
                        $sub->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    });
            })
            ->with(['jobPost' => function ($q): void {
                $q->with(['employer', 'category']);
            }])
            ->orderByDesc('match_score')
            ->orderByDesc('created_at');

        // Optional filter by minimum match score
        if ($request->has('min_score')) {
            $query->where('match_score', '>=', $request->integer('min_score'));
        }

        // Optional filter by remote
        if ($request->boolean('is_remote')) {
            $query->whereHas('jobPost', function (Builder $q): void {
                $q->where('is_remote', true);
            });
        }

        $paginated = $query->paginate($request->integer('per_page', 10));

        $items = collect($paginated->items())->map(function (JobMatch $match) use ($savedJobIds, $appliedJobIds): array {
            /** @var JobPost $jobPost */
            $jobPost = $match->jobPost;

            return [
                'id' => $match->id,
                'match_score' => $match->match_score,
                'match_reasons' => $match->match_reasons,
                'created_at' => $match->created_at?->toIso8601String(),
                'job' => (new JobPostResource($jobPost))->resolve(),
                'is_saved' => in_array($jobPost->id, $savedJobIds, true),
                'has_applied' => in_array($jobPost->id, $appliedJobIds, true),
            ];
        });

        return $this->success([
            'feed' => $items,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'profile_status' => [
                'is_complete' => $isComplete,
                'headline' => $profile?->headline,
                'skills_count' => is_array($profile?->skills) ? count(array_filter($profile->skills)) : 0,
            ],
        ], 'Matched job feed retrieved successfully');
    }

    /**
     * Dismiss a job recommendation from the feed.
     */
    public function dismiss(Request $request, JobPost $jobPost): JsonResponse
    {
        $user = $request->user();

        $updated = JobMatch::where('user_id', $user->id)
            ->where('job_post_id', $jobPost->id)
            ->update(['is_dismissed' => true]);

        if (! $updated) {
            // Create dismissed record if it wasn't pre-existing
            JobMatch::create([
                'user_id' => $user->id,
                'job_post_id' => $jobPost->id,
                'match_score' => 0,
                'is_dismissed' => true,
            ]);
        }

        return $this->success(null, 'Job recommendation dismissed');
    }
}
