import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search, FileText, ClipboardList, Briefcase,
  CheckCircle2, Clock, XCircle, ArrowRight, Building2, ShieldAlert
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
      navigate('/employer-dashboard', { replace: true })\n    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  const isVerified = Boolean(user?.email_verified_at)

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      try {
        const res = await api.get('/employee/applications')
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        return (Array.isArray(raw) ? raw : []) as Application[]
      } catch (err: any) {
        if (err?.response?.status === 403) {
          return []
        }
        throw err
      }
    },
    enabled: !!user && isVerified,
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
    {\n      label: t('dashboard.totalApplied'),
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

          {/* Email verification reminder banner if unverified */}
          {user && !isVerified && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-0 shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Verify your email address</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please verify your email to unlock applications, match tracking, and live notifications.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/verify-email')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0 shadow-xs"
              >
                Verify Now
              </button>
            </div>
          )}

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
                    <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                      {stat.badge}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Nav Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="group bg-card border border-border/70 hover:border-foreground/30 rounded-xl p-4 cursor-pointer transition-all duration-150 hover:shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80 transition-colors">
                        <Icon size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    </div>
                    <ArrowRight size={13} className="text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Recommended Jobs Feed - Algorithmic Matching with resilient fallback */}
          <RecommendedJobFeed />

          {/* Recent Applications Table */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  {t('dashboard.recentApplications')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                  {total}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/my-applications')}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-xs text-muted-foreground">
                Loading applications...
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-card p-10 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Briefcase size={18} className="text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t('dashboard.noApplicationsYet')}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {t('dashboard.noApplicationsDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/job-search')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  <Search size={12} />
                  <span>{t('dashboard.exploreJobs')}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-card overflow-hidden divide-y divide-border/60">
                {recent.map((app) => {
                  const statusLabel = getStatusLabel(app)
                  const tagStyle = statusTagStyles[statusLabel]
                  const formattedDate = new Date(app.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  return (
                    <div
                      key={app.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => app.job_post?.slug && navigate(`/jobs/${app.job_post.slug}`)}
                            className="text-sm font-semibold text-foreground hover:underline cursor-pointer tracking-tight line-clamp-1"
                          >
                            {app.job_post?.title ?? 'Job Position'}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {app.job_post?.employer?.company_name && (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Building2 size={12} />
                              {app.job_post.employer.company_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Applied {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tagStyle}`}>
                          {statusLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/my-applications')}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                        >
                          Details
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
