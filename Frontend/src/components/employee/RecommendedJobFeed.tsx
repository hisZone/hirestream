import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles,
  MapPin,
  Building2,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Briefcase,
  X,
  ArrowUpRight,
  ShieldAlert,
  Compass,
  RotateCw,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { JobPost } from '@/types'
import {
  employeeFeedService,
  type MatchedJobItem,
} from '@/services/employeeFeedService'
import ProfileSetupPromptBanner from './ProfileSetupPromptBanner'

export default function RecommendedJobFeed() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [filterMode, setFilterMode] = useState<'all' | 'high_match' | 'remote'>('all')

  const isVerified = Boolean(user?.email_verified_at)
  const minScore = filterMode === 'high_match' ? 70 : undefined
  const isRemote = filterMode === 'remote' ? true : undefined

  // Fetch personalized algorithmic feed only when verified
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['employee-job-feed', filterMode],
    queryFn: () => employeeFeedService.getFeed({ min_score: minScore, is_remote: isRemote }),
    retry: (failureCount, err: any) => {
      // Never retry on 401 or 403
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
    enabled: isVerified,
  })

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (jobId: number) => employeeFeedService.dismissJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-job-feed'] })
      toast.success('Recommendation dismissed')
    },
    onError: () => {
      toast.error('Failed to dismiss recommendation')
    },
  })

  // Toggle save mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await api.post(`/employee/saved-jobs/${jobId}/toggle`)
      return res.data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['employee-job-feed'] })
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['saved-job-ids'] })
      toast.success(res?.message || 'Saved status updated')
    },
    onError: () => {
      toast.error('Failed to update saved job')
    },
  })

  // Fetch saved job IDs for bookmark icons on fallback jobs
  const { data: savedJobIds = [] } = useQuery({
    queryKey: ['saved-job-ids'],
    queryFn: async () => {
      const res = await api.get('/employee/saved-jobs/ids')
      const raw = res.data?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as number[]
    },
    enabled: isVerified,
  })

  const is403 = !isVerified || (error as any)?.response?.status === 403
  const feedItems = data?.feed ?? []
  const profileStatus = data?.profile_status

  // Fallback query to public jobs when feed fails, returns 403, or has 0 recommendations
  const shouldFetchFallback = is403 || isError || (!isLoading && feedItems.length === 0)

  const {
    data: fallbackJobs = [],
    isLoading: isFallbackLoading,
  } = useQuery<JobPost[]>({
    queryKey: ['public-featured-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs', { params: { per_page: 6 } })
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as JobPost[]
    },
    enabled: shouldFetchFallback,
  })

  // If candidate has not set up profile headline or skills, show setup prompt banner
  if (!isLoading && profileStatus && !profileStatus.is_complete) {
    const missing: string[] = []
    if (!profileStatus.headline) missing.push('Headline / Target Role')
    if (profileStatus.skills_count === 0) missing.push('Skills')

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Recommended Jobs
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
              Needs profile
            </span>
          </div>
        </div>
        <ProfileSetupPromptBanner missingFields={missing} />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Recommended Jobs For You
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 tracking-wide">
              <Sparkles size={10} />
              <span>Algorithmic Match</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Matched against your verified skills and target role when employers post jobs.
          </p>
        </div>

        {/* Filters (only show when active feed is available) */}
        {!is403 && !isError && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/50 p-1 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Matches
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('high_match')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'high_match'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              70%+ High Match
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('remote')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'remote'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Remote
            </button>
          </div>
        )}
      </div>

      {/* 403 / Unverified Email Alert Banner */}
      {is403 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                Verify your email to unlock personalized job recommendations
              </h4>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Our algorithmic matching engine scores live positions against your target role and skills once your email is confirmed. In the meantime, browse active featured openings below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/verify-email')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0 shadow-xs"
          >
            Verify Email
          </button>
        </div>
      )}

      {/* Generic Non-403 Error Notice with Retry */}
      {!is403 && isError && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Personalized matches are temporarily unavailable. Showing active open positions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline self-start sm:self-auto"
          >
            <RotateCw size={12} className={isFetching ? 'animate-spin' : ''} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-card border border-border/70 p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : !is403 && !isError && feedItems.length > 0 ? (
          // Personalized Matches
          feedItems.map((item: MatchedJobItem) => {
            const { job, match_score, match_reasons, is_saved, has_applied } = item
            const matchedSkills = match_reasons?.matched_skills ?? []
            const employerName = job.employer?.company_name || 'Hiring Company'

            return (
              <div
                key={item.id}
                className="group relative rounded-xl border border-border/70 bg-card p-4 sm:p-5 transition-all duration-150 hover:border-foreground/30 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Job Info & Match Badges */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        {match_score}% MATCH
                      </span>

                      {match_reasons?.is_core_match && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border/80">
                          <CheckCircle2 size={11} className="text-foreground" />
                          Role Match{match_reasons?.seniority_alignment ? ` (${match_reasons.seniority_alignment})` : ''}
                        </span>
                      )}

                      {job.is_remote && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                          Remote
                        </span>
                      )}

                      {job.job_type && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60 capitalize">
                          {String(job.job_type).replace('_', ' ')}
                        </span>
                      )}

                      {has_applied && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 size={11} />
                          Applied
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => navigate(`/jobs/${job.slug}`)}
                        className="text-sm sm:text-base font-semibold text-foreground hover:underline cursor-pointer tracking-tight line-clamp-1"
                      >
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Building2 size={13} />
                          {employerName}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />
                            {job.location}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <DollarSign size={13} />
                            {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matched Skills Tags */}
                    {matchedSkills.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Matched skills:
                        </span>
                        {matchedSkills.map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground/90 border border-border/70"
                          >
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">✓</span>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="flex items-center gap-1.5">
                      {/* Save Bookmark */}
                      <button
                        type="button"
                        onClick={() => toggleSaveMutation.mutate(job.id)}
                        disabled={toggleSaveMutation.isPending}
                        className={`p-2 rounded-lg border transition-colors ${
                          is_saved
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                            : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                        }`}
                        title={is_saved ? 'Remove from saved' : 'Save job'}
                      >
                        {is_saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>

                      {/* Dismiss from feed */}
                      <button
                        type="button"
                        onClick={() => dismissMutation.mutate(job.id)}
                        disabled={dismissMutation.isPending}
                        className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-rose-500 hover:bg-muted transition-colors"
                        title="Dismiss recommendation"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* View Details / Apply CTA */}
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${job.slug}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-xs"
                    >
                      <span>View Job</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          // Fallback / Featured Openings Display
          <div className="space-y-4">
            {!is403 && !isError && feedItems.length === 0 && (
              <div className="rounded-xl border border-border/70 bg-card p-6 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Briefcase size={18} className="text-muted-foreground" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {filterMode !== 'all' ? 'No matching jobs for this filter' : 'No personalized matches yet'}
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  As employers post newly verified jobs matching your skills, our background analyzer will deliver them directly to your feed.
                </p>
              </div>
            )}

            {/* Fallback Jobs Header */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Compass size={15} className="text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Featured Open Positions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/job-search')}
                className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1"
              >
                Browse all jobs →
              </button>
            </div>

            {/* Fallback Jobs Cards */}
            {isFallbackLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl bg-card border border-border/70 p-4 animate-pulse space-y-2"
                  >
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/4 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : fallbackJobs.length > 0 ? (
              fallbackJobs.map((job) => {
                const employerName = job.employer?.company_name || 'Verified Company'
                const isSaved = savedJobIds.includes(job.id)

                return (
                  <div
                    key={job.id}
                    className="group relative rounded-xl border border-border/70 bg-card p-4 sm:p-5 transition-all duration-150 hover:border-foreground/30 hover:shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left Job Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-foreground border border-border/60">
                            Open
                          </span>
                          {job.is_remote && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                              Remote
                            </span>
                          )}
                          {job.job_type && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60 capitalize">
                              {String(job.job_type).replace('_', ' ')}
                            </span>
                          )}
                          {job.category?.name && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                              {job.category.name}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3
                            onClick={() => navigate(`/jobs/${job.slug}`)}
                            className="text-sm sm:text-base font-semibold text-foreground hover:underline cursor-pointer tracking-tight line-clamp-1"
                          >
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Building2 size={13} />
                              {employerName}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={13} />
                                {job.location}
                              </span>
                            )}
                            {(job.salary_min || job.salary_max) && (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <DollarSign size={13} />
                                {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description snippet */}
                        {job.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                            {job.description.replace(/<[^>]*>?/gm, '')}
                          </p>
                        )}
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        {isVerified && (
                          <button
                            type="button"
                            onClick={() => toggleSaveMutation.mutate(job.id)}
                            disabled={toggleSaveMutation.isPending}
                            className={`p-2 rounded-lg border transition-colors ${
                              isSaved
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                                : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                            }`}
                            title={isSaved ? 'Remove from saved' : 'Save job'}
                          >
                            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${job.slug}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-xs"
                        >
                          <span>View Job</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-border/70 bg-card p-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No public job listings found at this moment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
