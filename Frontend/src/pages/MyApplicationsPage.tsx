import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Briefcase, ArrowUpRight, Search, Building2, Calendar } from 'lucide-react'
import EmployeeSidebar from '@/components/employee/EmployeeSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'
import { InterviewCountdown } from '@/components/interview/InterviewCountdown'
import { InterviewDetailsModal } from '@/components/interview/InterviewDetailsModal'
import type { InterviewItem } from '@/types'
import { Video } from 'lucide-react'
import api from '@/lib/api'

type StatusLabel = 'Submitted' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Hired'

interface Application {
  id: number
  status?: string
  status_label?: StatusLabel
  created_at: string
  job_post: {
    id: number
    title: string
    slug: string
    job_type_label: string
    location: string | null
    salary_min: number | null
    salary_max: number | null
    salary_currency: string
    employer: { company_name: string } | null
  } | null
  interview?: InterviewItem | null
}

const statusTagStyles: Record<StatusLabel, string> = {
  Submitted: 'bg-muted text-muted-foreground border border-border',
  'Under Review': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  Shortlisted: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
  Rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
  Hired: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
}

const statusMap: Record<string, StatusLabel> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
  Submitted: 'Submitted',
  'Under Review': 'Under Review',
  Shortlisted: 'Shortlisted',
  Rejected: 'Rejected',
  Hired: 'Hired',
}

function getStatusLabel(app: Application): StatusLabel {
  if (app.status_label && app.status_label in statusTagStyles) {
    return app.status_label
  }
  if (app.status && statusMap[app.status]) {
    return statusMap[app.status]
  }
  return 'Submitted'
}

function formatSalary(app: Application['job_post']): string {
  if (!app || (app.salary_min == null && app.salary_max == null)) return ''
  const min = app.salary_min != null ? Number(app.salary_min).toLocaleString() : null
  const max = app.salary_max != null ? Number(app.salary_max).toLocaleString() : null
  if (min && max) return `${min} – ${max} ${app.salary_currency}`
  return `${min ?? max} ${app.salary_currency}`
}

export default function MyApplicationsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<StatusLabel | 'All'>('All')
  const [selectedInterviewApp, setSelectedInterviewApp] = useState<Application | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/employee/applications')
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as Application[]
    },
  })

  const applications = Array.isArray(data) ? data : []
  const filtered =
    activeTab === 'All'
      ? applications
      : applications.filter((a) => getStatusLabel(a) === activeTab)
  const countFor = (val: StatusLabel | 'All') =>
    val === 'All'
      ? applications.length
      : applications.filter((a) => getStatusLabel(a) === val).length

  const tabs: { label: string; value: StatusLabel | 'All' }[] = [
    { label: t('applications.all'), value: 'All' },
    { label: t('applications.submitted'), value: 'Submitted' },
    { label: t('applications.underReview'), value: 'Under Review' },
    { label: t('applications.shortlisted'), value: 'Shortlisted' },
    { label: t('applications.rejected'), value: 'Rejected' },
    { label: t('applications.hired'), value: 'Hired' },
  ]

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title={t('applications.title')} />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion-style Document Header */}
          <div className="border-b border-border/60 pb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
                ☷
              </span>
              <span>Applications Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t('applications.title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track the progress, status, and timeline of your submitted job applications.
            </p>
          </div>

          {/* Notion Database Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
            {tabs.map((tab) => {
              const isActive = tab.value === activeTab
              const count = countFor(tab.value)
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-200/70 dark:bg-neutral-800 text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-background text-foreground shadow-2xs font-mono font-medium'
                        : 'bg-muted/70 text-muted-foreground font-mono'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="bg-card border border-border/70 rounded-xl divide-y divide-border/60 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-9 w-9 bg-muted rounded-lg flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 text-sm text-rose-700 dark:text-rose-300">
              {t('applications.failedToLoad')}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="bg-card border border-border/70 rounded-xl p-12 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {activeTab === 'All'
                    ? t('applications.noApplications')
                    : t('applications.noStatusApplications', { status: activeTab })}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Explore open roles in the candidate workspace and submit your profile.
                </p>
              </div>
              {activeTab === 'All' && (
                <button
                  onClick={() => navigate('/job-search')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Browse Open Jobs</span>
                </button>
              )}
            </div>
          )}

          {/* Applications List - Notion Database Table */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="bg-card border border-border/70 rounded-xl divide-y divide-border/60 overflow-hidden shadow-xs">
              {filtered.map((app) => {
                const job = app.job_post
                const salary = formatSalary(job)
                const statusLabel = getStatusLabel(app)

                return (
                  <div
                    key={app.id}
                    className="group flex flex-col p-4 sm:p-5 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/80 font-bold text-xs flex-shrink-0 mt-0.5">
                        {job?.employer?.company_name?.[0]?.toUpperCase() ?? (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <button
                          onClick={() => job?.slug && navigate(`/jobs/${job.slug}`)}
                          className="font-semibold text-sm text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-left truncate block"
                        >
                          {job?.title ?? t('applications.unknownPosition')}
                        </button>

                        {/* Critical subtitle template string matching test exactly */}
                        <p className="text-xs text-muted-foreground">
                          {job?.employer?.company_name ?? '—'}
                          {job?.location ? ` • ${job.location}` : ''}
                          {salary ? ` • ${salary}` : ''}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          {job?.job_type_label && (
                            <>
                              <span>•</span>
                              <span>{job.job_type_label}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          statusTagStyles[statusLabel] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {statusLabel}
                      </span>

                      {job?.slug && (
                        <button
                          onClick={() => navigate(`/jobs/${job.slug}`)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 px-2.5 py-1 rounded-md transition-colors"
                          title="View job details"
                        >
                          <span>View Job</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    </div>

                    {/* Interview Callout Banner */}
                    {app.interview && (
                      <div className="w-full mt-2 p-3 sm:p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-foreground shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-foreground truncate">
                                {app.interview.title || 'Interview Scheduled'}
                              </span>
                              <InterviewCountdown
                                scheduledAt={app.interview.scheduled_at}
                                durationMinutes={app.interview.duration_minutes}
                                variant="badge"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {new Date(app.interview.scheduled_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              • {app.interview.duration_minutes} mins •{' '}
                              {app.interview.type === 'video'
                                ? 'Video Call'
                                : app.interview.type === 'in_person'
                                ? 'On-Site'
                                : 'Phone Call'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                          {app.interview.meeting_link && (
                            <a
                              href={app.interview.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Join Meeting
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedInterviewApp(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-2xs"
                          >
                            <Calendar className="w-3.5 h-3.5 text-foreground" />
                            Details & Calendar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {selectedInterviewApp?.interview && (
        <InterviewDetailsModal
          isOpen={!!selectedInterviewApp}
          onClose={() => setSelectedInterviewApp(null)}
          interview={selectedInterviewApp.interview}
          companyName={selectedInterviewApp.job_post?.employer?.company_name}
          jobTitle={selectedInterviewApp.job_post?.title}
        />
      )}
    </div>
  )
}
