<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\Application;
use App\Models\Employer;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $pendingJobApprovals = JobPost::where('status', JobStatus::PENDING_APPROVAL)->count();
        $pendingEmployerApprovals = Employer::where('approval_status', 'pending')->count();

        $recentJobs = JobPost::with('employer')
            ->withCount('applications')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (JobPost $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'company' => $job->employer->company_name ?? 'N/A',
                'applications' => $job->applications_count,
                'status' => $job->status->label(),
            ]);

        return $this->success([
            'total_users' => User::count(),
            'active_jobs' => JobPost::where('status', JobStatus::PUBLISHED)->count(),
            'total_applications' => Application::count(),
            'total_companies' => Employer::count(),
            'pending_job_approvals' => $pendingJobApprovals,
            'pending_employer_approvals' => $pendingEmployerApprovals,
            'jobs_approved' => JobPost::where('status', JobStatus::PUBLISHED)->count(),
            'active_users' => User::whereNotNull('email_verified_at')->count(),
            'pending_reviews' => $pendingJobApprovals + $pendingEmployerApprovals,
            'recent_jobs' => $recentJobs,
        ], 'Statistics retrieved successfully');
    }
}
