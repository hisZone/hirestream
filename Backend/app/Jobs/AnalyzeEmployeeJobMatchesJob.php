<?php

declare(strict_types=1);

namespace App\Jobs;

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

class AnalyzeEmployeeJobMatchesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public User $user
    ) {}

    /**
     * Execute the job.
     */
    public function handle(JobMatchingService $matchingService): void
    {
        $this->user->refresh();
        $this->user->loadMissing('employeeProfile');

        $profile = $this->user->employeeProfile;
        if (! $profile || ! $profile->isComplete()) {
            return;
        }

        // Retrieve all currently published and active jobs
        $publishedJobs = JobPost::query()
            ->published()
            ->with(['employer', 'category'])
            ->get();

        foreach ($publishedJobs as $job) {
            try {
                $result = $matchingService->calculateMatch($job, $profile);

                if ($result['is_match']) {
                    $match = JobMatch::where('user_id', $this->user->id)
                        ->where('job_post_id', $job->id)
                        ->first();

                    $isNewMatch = ($match === null);

                    if ($isNewMatch) {
                        JobMatch::create([
                            'user_id' => $this->user->id,
                            'job_post_id' => $job->id,
                            'match_score' => $result['score'],
                            'match_reasons' => $result['reasons'],
                            'is_dismissed' => false,
                        ]);

                        $this->user->notify(new JobMatchNotification($job, $result['score'], $result['reasons']));
                    } else {
                        $match->update([
                            'match_score' => $result['score'],
                            'match_reasons' => $result['reasons'],
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error("Failed to match JobPost {$job->id} for User {$this->user->id}: {$e->getMessage()}");
            }
        }
    }
}
