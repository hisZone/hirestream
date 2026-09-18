<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ApplicationResource;
use App\Http\Traits\ApiResponse;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminApplicationController extends Controller
{
    use ApiResponse;

    /**
     * Display a paginated listing of applications for admin.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['user', 'jobPost.employer']);

        // Status filter: 'submitted', 'under_review', 'shortlisted', 'rejected', 'hired'
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        // Search filter: applicant name, applicant email, job title, company name
        if ($request->filled('search')) {
            $search = $request->string('search')->value();
            $query->where(function ($q) use ($search): void {
                $q->whereHas('user', function ($uQ) use ($search): void {
                    $uQ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('jobPost', function ($jQ) use ($search): void {
                    $jQ->where('title', 'like', "%{$search}%")
                        ->orWhereHas('employer', function ($empQ) use ($search): void {
                            $empQ->where('company_name', 'like', "%{$search}%");
                        });
                });
            });
        }

        $applications = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->success(
            ApplicationResource::collection($applications)->response()->getData(true),
            'Applications retrieved successfully'
        );
    }

    /**
     * Update the status of an application.
     */
    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:submitted,under_review,shortlisted,rejected,hired'],
        ]);

        $statusValue = $request->string('status')->value();

        $application->update([
            'status' => ApplicationStatus::from($statusValue),
        ]);

        return $this->success(
            new ApplicationResource($application->load(['user', 'jobPost.employer'])),
            'Application status updated successfully'
        );
    }

    /**
     * Delete an application.
     */
    public function destroy(Application $application): JsonResponse
    {
        // Delete snapshot CV file if it exists
        if ($application->cv_path && Storage::disk('local')->exists($application->cv_path)) {
            Storage::disk('local')->delete($application->cv_path);
        }

        $application->delete();

        return $this->success(null, 'Application deleted successfully');
    }

    /**
     * Download CV for an application.
     */
    public function downloadCv(Application $application): StreamedResponse|JsonResponse
    {
        if (! $application->cv_path || ! Storage::disk('local')->exists($application->cv_path)) {
            return $this->error('CV file not found.', 404);
        }

        return Storage::disk('local')->download($application->cv_path, 'application_cv_'.$application->id.'.pdf');
    }
}
