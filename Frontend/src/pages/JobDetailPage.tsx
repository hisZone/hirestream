import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  MapPin, DollarSign, Briefcase, Globe,
  Building2, Check, Clock, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import EmployeeSidebar from '@/components/employee/EmployeeSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'
import api from '@/lib/api'

interface JobPost {
  id: number
  title: string
  slug: string
  description: string
  responsibilities?: string[]
  requirements?: string[]
  job_type_label: string
  experience_level_label: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  location: string | null
  is_remote: boolean
  published_at?: string
  employer: {
    company_name: string
    location?: string
    website?: string
  } | null
}

function formatSalary(job: JobPost, notSpecified: string) {
  if (!job.salary_min && !job.salary_max) return notSpecified
  if (job.salary_min && job.salary_max) {
    return `${Number(job.salary_min).toLocaleString()} - ${Number(job.salary_max).toLocaleString()} ${job.salary_currency}`
  }
  return `${Number(job.salary_min ?? job.salary_max).toLocaleString()} ${job.salary_currency}`
}

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: job, isLoading, isError } = useQuery<JobPost>({
    queryKey: ['job', slug],
    queryFn: async () => {
      const res = await api.get(`/jobs/${slug}`)
      return res.data?.data ?? res.data
    },
    enabled: !!slug,
  })

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/employee/applications')
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data
      return Array.isArray(raw) ? raw : []
    },
  })

  const hasApplied = (applicationsData ?? []).some(
    (app: any) => app.job_post?.id === job?.id || app.job_post_id === job?.id
  )

  const applyMutation = useMutation({
    mutationFn: (jobId: number) => api.post(`/jobs/${jobId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success(t('jobs.applicationSubmitted'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? t('jobs.failedToApply'))
    },
  })

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title={t('jobs.details')} />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion Breadcrumb / Back Link */}
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('common.back')}</span>
            </button>
          </div>

          {isLoading && (
            <div className="bg-card border border-border/70 rounded-xl p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-24 bg-muted rounded" />
            </div>
          )}

          {isError && (
            <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 text-xs text-rose-700 dark:text-rose-300">
              {t('jobs.failedToLoadDetails')}
            </div>
          )}

          {job && (
            <div className="space-y-6">
              {/* Document Header Card */}
              <div className="bg-card border border-border/70 rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-muted text-foreground/80 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                      {job.employer?.company_name?.[0]?.toUpperCase() ?? (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {job.title}
                      </h1>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground/80">
                          {job.employer?.company_name ?? t('jobs.unknownCompany')}
                        </span>
                        {job.employer?.location && (
                          <>
                            <span>•</span>
                            <span>{job.employer.location}</span>
                          </>
                        )}
                        {job.is_remote && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {t('jobs.remote')}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => !hasApplied && applyMutation.mutate(job.id)}
                    disabled={hasApplied || applyMutation.isPending}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all self-start sm:self-auto ${
                      hasApplied
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 cursor-default'
                        : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50'
                    }`}
                  >
                    {hasApplied && <Check className="h-3.5 w-3.5" />}
                    <span>
                      {applyMutation.isPending
                        ? t('jobs.applying')
                        : hasApplied
                        ? t('jobs.applied')
                        : t('jobs.applyNow')}
                    </span>
                  </button>
                </div>

                {applyMutation.isError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {(applyMutation.error as any)?.response?.data?.message ?? t('jobs.failedToApply')}
                  </p>
                )}

                {/* Notion Property Table / Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-border/50 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                      Location
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {job.location ?? (job.is_remote ? t('jobs.remote') : 'Not specified')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                      Compensation
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1.5 font-mono">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatSalary(job, t('jobs.salaryNotSpecified'))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                      Job Type
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      {job.job_type_label}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                      Posted
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1.5 font-mono">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {job.published_at ? new Date(job.published_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card border border-border/70 rounded-xl p-6 shadow-xs space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('jobs.description')}
                </h2>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="bg-card border border-border/70 rounded-xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('jobs.responsibilities')}
                  </h2>
                  <ul className="space-y-2.5 pt-1">
                    {job.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-card border border-border/70 rounded-xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('jobs.requirements')}
                  </h2>
                  <ul className="space-y-2.5 pt-1">
                    {job.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* About Employer */}
              {job.employer && (
                <div className="bg-card border border-border/70 rounded-xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('jobs.aboutCompany')}
                  </h2>
                  <div className="flex items-start gap-3.5 pt-1">
                    <div className="h-10 w-10 rounded-lg bg-muted text-foreground/80 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {job.employer.company_name}
                      </p>
                      {job.employer.location && (
                        <p className="text-xs text-muted-foreground">{job.employer.location}</p>
                      )}
                      {job.employer.website && (
                        <a
                          href={job.employer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline pt-0.5"
                        >
                          <Globe className="h-3 w-3" />
                          <span>{job.employer.website}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
