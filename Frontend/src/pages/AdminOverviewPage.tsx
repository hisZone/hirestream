import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  BriefcaseBusiness,
  FileText,
  Building2,
  UserCheck,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import api from '@/lib/api'
import { usePageRefresh } from '@/hooks/usePageRefresh'

interface RecentJob {
  id: number
  title: string
  company: string
  applications: number
  status: string
}

interface AdminStatsData {
  total_users: number
  active_jobs: number
  total_applications: number
  total_companies: number
  active_users: number
  pending_reviews: number
  jobs_approved: number
  pending_job_approvals: number
  pending_employer_approvals: number
  recent_jobs: RecentJob[]
}

export default function AdminOverviewPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get('/admin/stats')
      const data: AdminStatsData = response.data?.data ?? response.data
      setStats(data)
    } catch (err: unknown) {
      console.error('Failed to fetch admin stats:', err)
      setError('Failed to load dashboard statistics from backend.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  usePageRefresh(fetchStats)

  const statCards = [
    {
      title: 'Total Users',
      value: stats ? stats.total_users.toLocaleString() : '0',
      subtitle: 'Registered accounts',
      icon: Users,
    },
    {
      title: 'Active Jobs',
      value: stats ? stats.active_jobs.toLocaleString() : '0',
      subtitle: 'Published listings',
      icon: BriefcaseBusiness,
    },
    {
      title: 'Applications',
      value: stats ? stats.total_applications.toLocaleString() : '0',
      subtitle: 'Total candidate submissions',
      icon: FileText,
    },
    {
      title: 'Companies',
      value: stats ? stats.total_companies.toLocaleString() : '0',
      subtitle: 'Registered organizations',
      icon: Building2,
    },
  ]

  const statusPills = [
    {
      label: 'Jobs Awaiting Moderation',
      count: stats?.pending_job_approvals ?? 0,
      path: '/admin/jobs?status=pending_approval',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Clock,
    },
    {
      label: 'Employer Accounts Pending',
      count: stats?.pending_employer_approvals ?? 0,
      path: '/admin/users?status=pending',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: UserCheck,
    },
    {
      label: 'Active Published Positions',
      count: stats?.jobs_approved ?? stats?.active_jobs ?? 0,
      path: '/admin/jobs?status=published',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle,
    },
  ]

  const statusBadgeStyle = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'published' || s === 'approved') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    }
    if (s === 'pending_approval' || s === 'pending') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    }
    if (s === 'rejected') {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
    }
    return 'bg-muted text-muted-foreground border border-border'
  }

  return (
    <div className="space-y-6">
      {/* Notion Document Header */}
      <div className="border-b border-border/60 pb-5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
            ⚡
          </span>
          <span>Admin Operations / Platform Dashboard</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real-time platform activity metrics, verification queues, and recent job postings.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="rounded-xl border border-border/70 bg-card p-4.5 shadow-xs space-y-2 hover:border-foreground/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <div className="p-2 rounded-lg bg-muted text-foreground">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : card.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Priority Action Banners */}
      <div className="grid gap-3 sm:grid-cols-3">
        {statusPills.map((pill) => {
          const Icon = pill.icon
          return (
            <button
              key={pill.label}
              onClick={() => navigate(pill.path)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all text-left group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${pill.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {pill.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isLoading ? '...' : `${pill.count} items require action`}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          )
        })}
      </div>

      {/* Recent Jobs Supervision Table */}
      <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="p-4.5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recently Submitted Job Postings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Most recent jobs submitted by registered employers</p>
          </div>
          <button
            onClick={() => navigate('/admin/jobs')}
            className="text-xs font-medium text-foreground hover:text-muted-foreground flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3">Job Title</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Applications</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span>Loading recent activities...</span>
                    </div>
                  </td>
                </tr>
              ) : !stats?.recent_jobs || stats.recent_jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No recent job activity recorded yet.
                  </td>
                </tr>
              ) : (
                stats.recent_jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{job.title}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{job.company || 'Unknown Company'}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{job.applications ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${statusBadgeStyle(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate('/admin/jobs')}
                        className="text-xs font-medium text-foreground hover:underline"
                      >
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
