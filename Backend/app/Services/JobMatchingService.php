<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\EmployeeProfile;
use App\Models\JobPost;

class JobMatchingService
{
    /**
     * Stop words excluded from title and keyword tokenization.
     *
     * @var list<string>
     */
    protected const STOP_WORDS = [
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'were', 'will', 'with', 'or', 'we', 'you', 'our',
    ];

    /**
     * Seniority modifiers to detect and normalize for core role comparison.
     *
     * @var list<string>
     */
    protected const SENIORITY_MODIFIERS = [
        'senior', 'sr', 'sr.', 'lead', 'principal', 'staff',
        'junior', 'jr', 'jr.', 'mid', 'mid-level', 'intermediate',
        'entry', 'entry-level', 'intern', 'associate', 'head of',
        'director', 'chief',
    ];

    /**
     * Synonym mappings to canonicalize tech roles and domains.
     *
     * @var array<string, string>
     */
    protected const ROLE_SYNONYMS = [
        'engineer' => 'developer',
        'programmer' => 'developer',
        'architect' => 'developer',
        'specialist' => 'developer',
        'back-end' => 'backend',
        'back end' => 'backend',
        'server-side' => 'backend',
        'front-end' => 'frontend',
        'front end' => 'frontend',
        'client-side' => 'frontend',
        'full-stack' => 'fullstack',
        'full stack' => 'fullstack',
        'dev ops' => 'devops',
        'sre' => 'devops',
    ];

    /**
     * Minimum score threshold to qualify as a recommended job match.
     */
    public const MATCH_THRESHOLD = 35;

    /**
     * Compute deterministic algorithmic match between a job post and an employee profile.
     *
     * @return array{is_match: bool, score: int, reasons: array<string, mixed>}
     */
    public function calculateMatch(JobPost $jobPost, EmployeeProfile $profile): array
    {
        $candidateSkills = array_values(array_filter(
            array_map('trim', (array) ($profile->skills ?? []))
        ));

        if (empty($candidateSkills) && empty($profile->headline)) {
            return [
                'is_match' => false,
                'score' => 0,
                'reasons' => [
                    'matched_skills' => [],
                    'title_similarity' => 0,
                    'category_match' => false,
                    'profile_incomplete' => true,
                ],
            ];
        }

        // 1. Skill Overlap Calculation
        $matchedSkills = $this->extractMatchedSkills($candidateSkills, $jobPost);
        $candidateSkillsCount = max(1, count($candidateSkills));
        $skillCoverage = count($matchedSkills) / $candidateSkillsCount;
        $skillScore = (int) round(min(1.0, $skillCoverage * 1.3) * 100);

        if (count($matchedSkills) >= 3) {
            $skillScore = max($skillScore, 75);
        } elseif (count($matchedSkills) >= 2) {
            $skillScore = max($skillScore, 55);
        } elseif (count($matchedSkills) === 1) {
            $skillScore = max($skillScore, 40);
        }

        // 2. Title & Role Overlap Calculation (Seniority & Synonym Normalized)
        $titleAnalysis = $this->analyzeRoleSimilarity($profile, $jobPost->title);
        $titleScore = $titleAnalysis['score'];
        $isCoreRoleMatch = $titleAnalysis['is_core_match'];
        $seniorityAlignment = $titleAnalysis['seniority'];

        // If core role is an exact match and skill list lacks direct keyword match, recognize domain skill
        if ($isCoreRoleMatch) {
            $coreSkillLabel = ucwords(trim($titleAnalysis['core_role']));
            if (! in_array($coreSkillLabel, $matchedSkills, true) && ! in_array($coreSkillLabel . ' Development', $matchedSkills, true)) {
                $matchedSkills[] = $coreSkillLabel . ' Development';
            }
        }

        // 3. Category, Location, & Preference Alignment
        $preferenceScore = $this->calculatePreferenceAlignment($profile, $jobPost);

        // 4. Adaptive Composite Algorithmic Score
        if ($isCoreRoleMatch || $titleScore >= 85) {
            // Strong Role Match: Guarantee high baseline (75+), with skills and preferences boosting up to 98%
            $baseScore = 75;
            $skillBonus = (int) round(($skillScore / 100) * 15);
            $prefBonus = (int) round(($preferenceScore / 100) * 10);
            $compositeScore = min(100, $baseScore + $skillBonus + $prefBonus);
        } elseif ($titleScore >= 50 && $skillScore >= 40) {
            // Good role alignment + verified skills
            $compositeScore = (int) round(
                ($titleScore * 0.45) +
                ($skillScore * 0.40) +
                ($preferenceScore * 0.15)
            );
        } else {
            // General weighted scoring
            $compositeScore = (int) round(
                ($skillScore * 0.50) +
                ($titleScore * 0.35) +
                ($preferenceScore * 0.15)
            );
        }

        $compositeScore = max(0, min(100, $compositeScore));
        $isMatch = $compositeScore >= self::MATCH_THRESHOLD && (! empty($matchedSkills) || $titleScore >= 50);

        return [
            'is_match' => $isMatch,
            'score' => $compositeScore,
            'reasons' => [
                'matched_skills' => array_values(array_unique($matchedSkills)),
                'matched_role' => $jobPost->title,
                'title_similarity' => $titleScore,
                'is_core_match' => $isCoreRoleMatch,
                'seniority_alignment' => $seniorityAlignment,
                'category_match' => $this->checkCategoryMatch($profile, $jobPost),
                'is_remote' => (bool) $jobPost->is_remote,
                'matched_skills_count' => count($matchedSkills),
            ],
        ];
    }

    /**
     * Identify which of the candidate's skills appear in the job's title, requirements, responsibilities, or description.
     *
     * @param  list<string>  $candidateSkills
     * @return list<string>
     */
    protected function extractMatchedSkills(array $candidateSkills, JobPost $jobPost): array
    {
        $requirements = is_array($jobPost->requirements) ? implode(' ', $jobPost->requirements) : '';
        $responsibilities = is_array($jobPost->responsibilities) ? implode(' ', $jobPost->responsibilities) : '';

        $haystack = mb_strtolower(
            $jobPost->title . ' ' .
            $jobPost->description . ' ' .
            $requirements . ' ' .
            $responsibilities . ' ' .
            ($jobPost->category !== null ? $jobPost->category->name : '')
        );

        $matched = [];
        foreach ($candidateSkills as $skill) {
            $normalizedSkill = trim(mb_strtolower($skill));
            if ($normalizedSkill === '') {
                continue;
            }

            // Word-boundary or direct token occurrence match
            $escaped = preg_quote($normalizedSkill, '/');
            if (preg_match('/(?:\\b|[\\s\\-_,\\.\\/]|^)' . $escaped . '(?:\\b|[\\s\\-_,\\.\\/]|$)/i', $haystack)) {
                $matched[] = $skill;
            } elseif (str_contains($haystack, $normalizedSkill)) {
                $matched[] = $skill;
            }
        }

        return array_values(array_unique($matched));
    }

    /**
     * Analyze role similarity with seniority normalization and synonym canonicalization.
     *
     * @return array{score: int, is_core_match: bool, core_role: string, seniority: string|null}
     */
    public function analyzeRoleSimilarity(EmployeeProfile $profile, string $jobTitle): array
    {
        $titlesToCheck = [];

        if (! empty(trim($profile->headline ?? ''))) {
            $titlesToCheck[] = trim($profile->headline);
        }

        // Also check work experience titles if present
        if (is_array($profile->experience)) {
            foreach ($profile->experience as $exp) {
                if (is_array($exp) && ! empty($exp['title']) && is_string($exp['title'])) {
                    $titlesToCheck[] = trim($exp['title']);
                }
            }
        }

        if (empty($titlesToCheck)) {
            return [
                'score' => 0,
                'is_core_match' => false,
                'core_role' => '',
                'seniority' => null,
            ];
        }

        $bestScore = 0;
        $bestIsCoreMatch = false;
        $bestCoreRole = '';
        $bestSeniority = null;

        foreach ($titlesToCheck as $candidateTitle) {
            $result = $this->compareSingleTitle($candidateTitle, $jobTitle);
            if ($result['score'] > $bestScore) {
                $bestScore = $result['score'];
                $bestIsCoreMatch = $result['is_core_match'];
                $bestCoreRole = $result['core_role'];
                $bestSeniority = $result['seniority'];
            }
        }

        return [
            'score' => $bestScore,
            'is_core_match' => $bestIsCoreMatch,
            'core_role' => $bestCoreRole,
            'seniority' => $bestSeniority,
        ];
    }

    /**
     * Compare a single candidate title against the job title.
     *
     * @return array{score: int, is_core_match: bool, core_role: string, seniority: string|null}
     */
    protected function compareSingleTitle(string $candidateTitle, string $jobTitle): array
    {
        $candidateParsed = $this->canonicalizeTitle($candidateTitle);
        $jobParsed = $this->canonicalizeTitle($jobTitle);

        $candCore = $candidateParsed['core'];
        $jobCore = $jobParsed['core'];
        $candTokens = $candidateParsed['tokens'];
        $jobTokens = $jobParsed['tokens'];
        $seniority = $candidateParsed['seniority'];

        // Exact core role match (e.g. "backend developer" == "backend developer")
        if ($candCore !== '' && $candCore === $jobCore) {
            return [
                'score' => 100,
                'is_core_match' => true,
                'core_role' => $jobCore,
                'seniority' => $seniority ?? 'Aligned',
            ];
        }

        if (empty($candTokens) || empty($jobTokens)) {
            return [
                'score' => 0,
                'is_core_match' => false,
                'core_role' => '',
                'seniority' => null,
            ];
        }

        // Filter out polar opposite domains (e.g. Backend vs Frontend)
        if (
            (in_array('backend', $candTokens, true) && in_array('frontend', $jobTokens, true)) ||
            (in_array('frontend', $candTokens, true) && in_array('backend', $jobTokens, true))
        ) {
            return [
                'score' => 10,
                'is_core_match' => false,
                'core_role' => $jobCore,
                'seniority' => null,
            ];
        }

        $intersection = array_intersect($candTokens, $jobTokens);
        $overlapCount = count($intersection);

        if ($overlapCount === 0) {
            return [
                'score' => 0,
                'is_core_match' => false,
                'core_role' => '',
                'seniority' => null,
            ];
        }

        $similarity = $overlapCount / count($jobTokens);
        $score = (int) round(min(1.0, $similarity * 1.3) * 100);

        return [
            'score' => $score,
            'is_core_match' => $similarity >= 0.8,
            'core_role' => $jobCore,
            'seniority' => $seniority,
        ];
    }

    /**
     * Canonicalize title by replacing synonyms, detecting seniority, and cleaning tokens.
     *
     * @return array{core: string, tokens: list<string>, seniority: string|null}
     */
    protected function canonicalizeTitle(string $title): array
    {
        $lower = mb_strtolower(trim($title));

        // Canonicalize tech role synonyms
        foreach (self::ROLE_SYNONYMS as $syn => $repl) {
            $lower = preg_replace('/\\b' . preg_quote($syn, '/') . '\\b/u', $repl, $lower) ?? $lower;
        }

        // Detect and strip seniority modifiers
        $detectedSeniority = null;
        foreach (self::SENIORITY_MODIFIERS as $sen) {
            if (preg_match('/\\b' . preg_quote($sen, '/') . '\\b/u', $lower)) {
                $detectedSeniority = ucfirst($sen);
                $lower = preg_replace('/\\b' . preg_quote($sen, '/') . '\\b/u', '', $lower) ?? $lower;
            }
        }

        $tokens = $this->tokenize($lower);
        $core = implode(' ', $tokens);

        return [
            'core' => $core,
            'tokens' => $tokens,
            'seniority' => $detectedSeniority,
        ];
    }

    /**
     * Check preference alignment (remote compatibility, location, job type).
     */
    protected function calculatePreferenceAlignment(EmployeeProfile $profile, JobPost $jobPost): int
    {
        $score = 40; // Base baseline

        if ($jobPost->is_remote) {
            $score += 30;
        } elseif ($profile->location && $jobPost->location) {
            $candLoc = mb_strtolower(trim($profile->location));
            $jobLoc = mb_strtolower(trim($jobPost->location));
            if (str_contains($jobLoc, $candLoc) || str_contains($candLoc, $jobLoc)) {
                $score += 30;
            }
        }

        if ($profile->preferred_job_type !== null && $profile->preferred_job_type !== '') {
            $prefType = mb_strtolower(trim($profile->preferred_job_type));
            $jobTypeValue = mb_strtolower($jobPost->job_type->value);
            if ($prefType === $jobTypeValue) {
                $score += 30;
            }
        }

        return min(100, $score);
    }

    /**
     * Check if job category matches candidate bio or headline.
     */
    protected function checkCategoryMatch(EmployeeProfile $profile, JobPost $jobPost): bool
    {
        $categoryName = $jobPost->category?->name;
        if (! $categoryName) {
            return false;
        }

        $haystack = mb_strtolower(($profile->headline ?? '') . ' ' . ($profile->bio ?? ''));

        return str_contains($haystack, mb_strtolower($categoryName));
    }

    /**
     * Clean and split a string into lowercase distinct word tokens.
     *
     * @return list<string>
     */
    protected function tokenize(string $text): array
    {
        $clean = preg_replace('/[^\\p{L}\\p{N}]+/u', ' ', mb_strtolower($text));
        if (! $clean) {
            return [];
        }

        $tokens = array_filter(
            explode(' ', $clean),
            fn (string $t): bool => mb_strlen($t) >= 2 && ! in_array($t, self::STOP_WORDS, true)
        );

        return array_values(array_unique($tokens));
    }
}
