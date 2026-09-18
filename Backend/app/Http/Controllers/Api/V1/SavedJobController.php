<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SavedJobResource;
use App\Http\Traits\ApiResponse;
use App\Models\JobPost;
use App\Models\SavedJob;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedJobController extends Controller
{
    use ApiResponse;

    /**
     * Display a paginated listing of the employee's saved jobs.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = SavedJob::with(['jobPost.employer', 'jobPost.category'])
            ->where('user_id', $user->id);

        if ($search = $request->input('search')) {
            $query->whereHas('jobPost', function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('employer', function ($emp) use ($search): void {
                        $emp->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($categoryId = $request->input('category_id')) {
            $query->whereHas('jobPost', function ($q) use ($categoryId): void {
                $q->where('category_id', $categoryId);
            });
        }

        $savedJobs = $query->latest()->paginate($request->integer('per_page', 12));

        return $this->success(
            SavedJobResource::collection($savedJobs)->response()->getData(true),
            'Saved jobs retrieved successfully'
        );
    }

    /**
     * Return array of all saved job post IDs for fast O(1) checking.
     */
    public function savedJobIds(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $ids = SavedJob::where('user_id', $user->id)->pluck('job_post_id')->values()->all();

        return $this->success($ids, 'Saved job IDs retrieved');
    }

    /**
     * Save a job post.
     */
    public function store(Request $request, JobPost $jobPost): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($jobPost->status !== JobStatus::PUBLISHED) {
            return $this->error('Only published job posts can be saved.', 422);
        }

        $savedJob = SavedJob::firstOrCreate([
            'user_id' => $user->id,
            'job_post_id' => $jobPost->id,
        ]);

        return $this->created(
            new SavedJobResource($savedJob->load(['jobPost.employer', 'jobPost.category'])),
            'Job saved successfully'
        );
    }

    /**
     * Remove a saved job.
     */
    public function destroy(Request $request, JobPost $jobPost): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        SavedJob::where('user_id', $user->id)
            ->where('job_post_id', $jobPost->id)
            ->delete();

        return $this->success(['job_post_id' => $jobPost->id, 'removed' => true], 'Job removed from saved list');
    }

    /**
     * Toggle saved status of a job post.
     */
    public function toggle(Request $request, JobPost $jobPost): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($jobPost->status !== JobStatus::PUBLISHED) {
            return $this->error('Only published job posts can be saved.', 422);
        }

        $existing = SavedJob::where('user_id', $user->id)
            ->where('job_post_id', $jobPost->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return $this->success(['job_post_id' => $jobPost->id, 'saved' => false], 'Job removed from saved list');
        }

        $savedJob = SavedJob::create([
            'user_id' => $user->id,
            'job_post_id' => $jobPost->id,
        ]);

        return $this->success([
            'job_post_id' => $jobPost->id,
            'saved' => true,
            'saved_job' => new SavedJobResource($savedJob->load(['jobPost.employer', 'jobPost.category'])),
        ], 'Job saved successfully');
    }
}
