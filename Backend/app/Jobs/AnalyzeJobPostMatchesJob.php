<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\JobStatus;
use App\Enums\UserRole;
use App\Models\JobMatch;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\V1\Employee\JobMatchNotification;
use App\Services\JobMatchingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeJobPostMatchesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public JobPost $jobPost
    ) {}

    /**
     * Execute the job.
     */
    public function handle(JobMatchingService $matchingService): void
    {
        $this->jobPost->refresh();

        // Only match against published jobs
        if ($this->jobPost->status !== JobStatus::PUBLISHED) {
            Log::info("AnalyzeJobPostMatchesJob: JobPost {$this->jobPost->id} is not published. Skipping matching.");

            return;
        }

        $this->jobPost->loadMissing(['employer', 'category']);

        // Retrieve active employees who have an employee profile
        $employees = User::query()
            ->where('role', UserRole::EMPLOYEE)
            ->where('is_suspended', false)
            ->whereHas('employeeProfile')
            ->with('employeeProfile')
            ->get();

        foreach ($employees as $employee) {
            $profile = $employee->employeeProfile;
            if (! $profile) {
                continue;
            }

            try {
                $result = $matchingService->calculateMatch($this->jobPost, $profile);

                if ($result['is_match']) {
                    $match = JobMatch::where('user_id', $employee->id)
                        ->where('job_post_id', $this->jobPost->id)
                        ->first();

                    $isNewMatch = ($match === null);

                    if ($isNewMatch) {
                        JobMatch::create([
                            'user_id' => $employee->id,
                            'job_post_id' => $this->jobPost->id,
                            'match_score' => $result['score'],
                            'match_reasons' => $result['reasons'],
                            'is_dismissed' => false,
                        ]);

                        $employee->notify(new JobMatchNotification($this->jobPost, $result['score'], $result['reasons']));
                    } else {
                        $match->update([
                            'match_score' => $result['score'],
                            'match_reasons' => $result['reasons'],
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error("Failed to match JobPost {$this->jobPost->id} for User {$employee->id}: {$e->getMessage()}");
            }
        }
    }
}
