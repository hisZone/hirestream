<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Application\StoreApplicationRequest;
use App\Http\Requests\V1\Application\UpdateApplicationStatusRequest;
use App\Http\Resources\V1\ApplicationResource;
use App\Http\Traits\ApiResponse;
use App\Models\Application;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employee\ApplicationStatusChangedNotification;
use App\Notifications\V1\Employer\NewApplicationReceivedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationController extends Controller
{
    use ApiResponse;

    /**
     * Job seeker applies to a job post.
     */
    public function store(StoreApplicationRequest $request, JobPost $jobPost): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->cv_path || ! Storage::disk('local')->exists($user->cv_path)) {
            return $this->error('Please upload your CV before applying.', 422);
        }

        if (Application::where('user_id', $user->id)->where('job_post_id', $jobPost->id)->exists()) {
            return $this->error('You have already applied to this job.', 409);
        }

        // Snapshot the CV so future re-uploads don't affect this application
        $snapshotPath = 'cvs/applications/'.Str::uuid().'.pdf';
        Storage::disk('local')->copy($user->cv_path, $snapshotPath);

        $application = Application::create([
            'user_id' => $user->id,
            'job_post_id' => $jobPost->id,
            'cv_path' => $snapshotPath,
            'cover_letter' => $request->validated('cover_letter'),
            'status' => ApplicationStatus::SUBMITTED,
        ]);

        $employerUser = $jobPost->employer?->user;
        if ($employerUser) {
            $employerUser->notify(new NewApplicationReceivedNotification($application, $jobPost, $user));
        }

        return $this->created($application, 'Application submitted successfully');
    }

    /**
     * List the authenticated job seeker's own applications.
     */
    public function index(Request $request): JsonResponse
    {
        $applications = Application::with(['jobPost.employer', 'interview'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return $this->success(
            ApplicationResource::collection($applications)->response()->getData(true),
            'Applications retrieved successfully'
        );
    }

    /**
     * List applicants for an employer's job post with real status counts.
     */
    public function jobApplicants(Request $request, JobPost $jobPost): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only view applicants for your own job posts.');
        }

        $query = Application::with(['user', 'jobPost.employer', 'interview'])
            ->where('job_post_id', $jobPost->id);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('user', function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $applications = $query->latest()->paginate($request->integer('per_page', 15));

        $data = ApplicationResource::collection($applications)->response()->getData(true);

        // Real scenario status breakdown counts for this job post
        $rawCounts = Application::where('job_post_id', $jobPost->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $data['counts'] = [
            'all' => Application::where('job_post_id', $jobPost->id)->count(),
            'submitted' => (int) ($rawCounts[ApplicationStatus::SUBMITTED->value] ?? 0),
            'under_review' => (int) ($rawCounts[ApplicationStatus::UNDER_REVIEW->value] ?? 0),
            'shortlisted' => (int) ($rawCounts[ApplicationStatus::SHORTLISTED->value] ?? 0),
            'rejected' => (int) ($rawCounts[ApplicationStatus::REJECTED->value] ?? 0),
            'hired' => (int) ($rawCounts[ApplicationStatus::HIRED->value] ?? 0),
        ];

        return $this->success(
            $data,
            'Applicants retrieved successfully'
        );
    }

    /**
     * Display a specific application details for the employer.
     */
    public function showApplicant(Request $request, Application $application): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($application->jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only view applications for your own job posts.');
        }

        return $this->success(
            new ApplicationResource($application->load(['user', 'jobPost.employer', 'interview'])),
            'Application details retrieved successfully'
        );
    }

    /**
     * Employer updates application status.
     */
    public function updateStatus(UpdateApplicationStatusRequest $request, Application $application): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($application->jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only update applications for your own job posts.');
        }

        $statusValue = $request->validated('status');
        $newStatus = ApplicationStatus::from($statusValue);

        try {
            DB::transaction(function () use ($application, $newStatus): void {
                $application->update([
                    'status' => $newStatus,
                ]);

                // Gracefully update scheduled interview if application is rejected or hired
                if ($application->interview) {
                    if ($newStatus === ApplicationStatus::REJECTED) {
                        $application->interview->update(['status' => 'cancelled']);
                    } elseif ($newStatus === ApplicationStatus::HIRED) {
                        $application->interview->update(['status' => 'completed']);
                    }
                }
            });
        } catch (\Throwable $e) {
            Log::error('Failed to update application status: ' . $e->getMessage(), [
                'application_id' => $application->id,
                'status' => $statusValue,
            ]);

            return $this->error('Failed to update application status: ' . $e->getMessage(), 500);
        }

        try {
            $applicantUser = $application->user;
            if ($applicantUser) {
                $applicantUser->notify(new ApplicationStatusChangedNotification($application, $application->jobPost, $newStatus));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to dispatch application status notification: ' . $e->getMessage());
        }

        return $this->success(
            new ApplicationResource($application->fresh(['user', 'jobPost.employer', 'interview'])),
            'Application status updated successfully'
        );
    }

    /**
     * Download applicant CV.
     */
    public function downloadCv(Request $request, Application $application): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($application->jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only download CVs for your own job applicants.');
        }

        if (! $application->cv_path || ! Storage::disk('local')->exists($application->cv_path)) {
            return $this->notFound('CV file not found.');
        }

        $applicantName = $application->user?->name ? Str::slug($application->user->name) : 'applicant';
        $filename = "{$applicantName}-cv-{$application->id}.pdf";

        return Storage::disk('local')->download($application->cv_path, $filename);
    }
}
