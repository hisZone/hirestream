<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Application\ScheduleInterviewRequest;
use App\Http\Resources\V1\InterviewResource;
use App\Http\Traits\ApiResponse;
use App\Models\Application;
use App\Models\Interview;
use App\Models\User;
use App\Notifications\V1\Employee\ApplicationStatusChangedNotification;
use App\Notifications\V1\Employee\InterviewScheduledNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    use ApiResponse;

    /**
     * Schedule or reschedule an interview for an applicant.
     */
    public function schedule(ScheduleInterviewRequest $request, Application $application): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($application->jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only schedule interviews for your own job applicants.');
        }

        // If the applicant is not shortlisted, automatically shortlist them
        $statusChanged = false;
        if ($application->status !== ApplicationStatus::SHORTLISTED) {
            $application->update(['status' => ApplicationStatus::SHORTLISTED]);
            $statusChanged = true;
        }

        $validated = $request->validated();
        $isReschedule = $application->interview()->exists();

        $interview = $application->interview()->updateOrCreate(
            ['application_id' => $application->id],
            [
                'employer_id' => $user->employer->id,
                'user_id' => $application->user_id,
                'job_post_id' => $application->job_post_id,
                'title' => $validated['title'] ?? 'Interview',
                'type' => $validated['type'],
                'scheduled_at' => $validated['scheduled_at'],
                'duration_minutes' => $validated['duration_minutes'] ?? 45,
                'timezone' => $validated['timezone'] ?? 'UTC',
                'meeting_link' => $validated['meeting_link'] ?? null,
                'location' => $validated['location'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'scheduled',
            ]
        );

        $applicantUser = $application->user;
        if ($applicantUser) {
            if ($statusChanged) {
                $applicantUser->notify(new ApplicationStatusChangedNotification(
                    $application,
                    $application->jobPost,
                    ApplicationStatus::SHORTLISTED
                ));
            }

            $applicantUser->notify(new InterviewScheduledNotification($interview, $isReschedule));
        }

        $message = $isReschedule ? 'Interview rescheduled successfully.' : 'Interview scheduled successfully.';

        return $this->success(new InterviewResource($interview), $message);
    }

    /**
     * Show interview details for an application.
     */
    public function show(Request $request, Application $application): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $isCandidate = $application->user_id === $user->id;
        $isEmployer = $application->jobPost->employer_id === $user->employer?->id;

        if (! $isCandidate && ! $isEmployer) {
            return $this->forbidden('You are not authorized to view this interview schedule.');
        }

        $interview = $application->interview;
        if (! $interview) {
            return $this->notFound('No interview scheduled for this application.');
        }

        return $this->success(new InterviewResource($interview), 'Interview details retrieved successfully.');
    }

    /**
     * Cancel an interview.
     */
    public function cancel(Request $request, Application $application): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($application->jobPost->employer_id !== $user->employer?->id) {
            return $this->forbidden('You can only cancel interviews for your own job applicants.');
        }

        $interview = $application->interview;
        if (! $interview) {
            return $this->notFound('No interview scheduled for this application.');
        }

        $interview->delete();

        return $this->success(null, 'Interview cancelled successfully.');
    }
}
