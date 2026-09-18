<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RejectJobPostRequest;
use App\Http\Resources\V1\JobPostResource;
use App\Http\Traits\ApiResponse;
use App\Models\JobPost;
use App\Services\JobPostWorkflowService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminJobPostController extends Controller
{
    use ApiResponse, AuthorizesRequests;

    /**
     * Display a listing of all job posts for Admin management with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobPost::with(['employer', 'category'])->withCount('applications');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->value();
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('employer', function ($empQ) use ($search): void {
                        $empQ->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        $jobs = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->success(
            JobPostResource::collection($jobs)->response()->getData(true),
            'Job posts retrieved successfully'
        );
    }

    /**
     * Display a listing of job posts pending approval (Admin).
     */
    public function pendingIndex(Request $request): JsonResponse
    {
        $jobs = JobPost::where('status', JobStatus::PENDING_APPROVAL)
            ->with(['employer', 'category'])
            ->withCount('applications')
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(
            JobPostResource::collection($jobs)->response()->getData(true),
            'Pending job posts retrieved successfully'
        );
    }

    /**
     * Approve a pending job post and publish it.
     */
    public function approve(JobPost $jobPost, JobPostWorkflowService $workflowService): JsonResponse
    {
        $this->authorize('approve', $jobPost);

        try {
            $updated = $workflowService->approve($jobPost);
            $updated->load(['employer', 'category']);

            return $this->success(
                new JobPostResource($updated),
                'Job post approved and published successfully'
            );
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Reject a pending job post with feedback.
     */
    public function reject(RejectJobPostRequest $request, JobPost $jobPost, JobPostWorkflowService $workflowService): JsonResponse
    {
        $this->authorize('reject', $jobPost);

        try {
            $reason = $request->validated('reason');
            $updated = $workflowService->reject($jobPost, $reason);
            $updated->load(['employer', 'category']);

            return $this->success(
                new JobPostResource($updated),
                'Job post rejected with feedback successfully'
            );
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Remove the specified job post from storage.
     */
    public function destroy(JobPost $jobPost): JsonResponse
    {
        $this->authorize('delete', $jobPost);

        $jobPost->delete();

        return $this->success(null, 'Job post deleted successfully');
    }
}
