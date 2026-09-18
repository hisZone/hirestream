import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search, FileText, ClipboardList, Briefcase,
  CheckCircle2, Clock, XCircle, ArrowRight, Building2
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import EmployeeSidebar from '@/components/employee/EmployeeSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'
import RecommendedJobFeed from '@/components/employee/RecommendedJobFeed'
import api from '@/lib/api'

type StatusLabel = 'Submitted' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Hired'

interface Application {
  id: number
  status?: string
  status_label?: StatusLabel
  created_at: string
  job_post: {
    title: string
    slug: string
    employer: { company_name: string } | null
    location: string | null
  } | null
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

export default function DashboardPage() {
  const { user, getProfile } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    getProfile()
  }, [getProfile])

  useEffect(() => {
    if (!user) return
    if (user.role === 'employer') {
      navigate('/employer-dashboard', { replace: true })
    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, getProfile, navigate])

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/employee/applications')
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data
      return (Array.isArray(raw) ? raw : []) as Application[]
    },
    enabled: !!user,
  })

  const applications = Array.isArray(data) ? data : []
  const total = applications.length
  const active = applications.filter((a) => {
    const status = getStatusLabel(a)
    return status === 'Submitted' || status === 'Under Review'
  }).length
  const shortlisted = applications.filter((a) => {
    const status = getStatusLabel(a)
    return status === 'Shortlisted' || status === 'Hired'
  }).length
  const rejected = applications.filter((a) => getStatusLabel(a) === 'Rejected').length
  const recent = applications.slice(0, 5)

  const stats = [
    {
      label: t('dashboard.totalApplied'),
      value: total,
      icon: Briefcase,
      badge: 'All time',
    },
    {
      label: t('dashboard.inProgress'),
      value: active,
      icon: Clock,
      badge: 'Active review',
    },
    {
      label: t('dashboard.shortlisted'),
      value: shortlisted,
      icon: CheckCircle2,
      badge: 'Advanced',
    },
    {
      label: t('dashboard.rejected'),
      value: rejected,
      icon: XCircle,
      badge: 'Closed',
    },
  ]

  const quickLinks = [
    {
      label: t('dashboard.searchJobs'),
      icon: Search,
      path: '/job-search',
      desc: t('dashboard.searchJobsDesc'),
    },
    {
      label: t('dashboard.myApplications'),
      icon: FileText,
      path: '/my-applications',
      desc: t('dashboard.myApplicationsDesc'),
    },
    {
      label: t('dashboard.cvResume'),
      icon: ClipboardList,
      path: '/cv-resume',
      desc: t('dashboard.cvResumeDesc'),
    },
  ]

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title={t('dashboard.title')} />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion-style Document Header */}
          <div className="border-b border-border/60 pb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
                ⌘
              </span>
              <span>Candidate Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t('dashboard.welcome', { name: user?.name ?? 'there' })}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('dashboard.description')}
            </p>
          </div>

          {/* Metric Cards - Notion Database Style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-card border border-border/70 rounded-xl p-4 transition-all duration-150 hover:border-foreground/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/80" />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {isLoading ? '—' : stat.value}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70">{stat.badge}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions - Notion Block Style */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('dashboard.quickActions')}
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="group flex items-start justify-between p-4 bg-card border border-border/70 rounded-xl hover:bg-muted/50 hover:border-foreground/25 transition-all text-left"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted text-foreground flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:underline">
                          {link.label}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {link.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-2 flex-shrink-0 mt-1" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recommended Jobs Feed - Algorithmic Matching */}
          <RecommendedJobFeed />

          {/* Recent Applications - Notion Table / Database View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('dashboard.recentApplications')}
                </h2>
                {applications.length > 0 && (
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                    {applications.length}
                  </span>
                )}
              </div>
              {applications.length > 0 && (
                <button
                  onClick={() => navigate('/my-applications')}
                  className="text-xs font-medium text-foreground hover:underline transition-all"
                >
                  {t('dashboard.viewAll')} →
                </button>
              )}
            </div>

            {isLoading && (
              <div className="bg-card border border-border/70 rounded-xl divide-y divide-border/60">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-6 w-20 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && applications.length === 0 && (
              <div className="bg-card border border-border/70 rounded-xl p-8 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t('dashboard.noApplicationsYet')}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {t('dashboard.startApplying')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/job-search')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{t('dashboard.browseJobs')}</span>
                </button>
              </div>
            )}

            {!isLoading && applications.length > 0 && (
              <div className="bg-card border border-border/70 rounded-xl divide-y divide-border/60 overflow-hidden shadow-xs">
                {recent.map((app) => {
                  const statusLabel = getStatusLabel(app)
                  return (
                    <div
                      key={app.id}
                      onClick={() => app.job_post?.slug && navigate(`/jobs/${app.job_post.slug}`)}
                      className="group flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground/80 font-bold text-xs flex-shrink-0">
                          {app.job_post?.employer?.company_name?.[0]?.toUpperCase() ?? (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {app.job_post?.title ?? t('applications.unknownPosition')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                            <span>{app.job_post?.employer?.company_name ?? '—'}</span>
                            {app.job_post?.location && (
                              <>
                                <span>•</span>
                                <span>{app.job_post.location}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            statusTagStyles[statusLabel] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
