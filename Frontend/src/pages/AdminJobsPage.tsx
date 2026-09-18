import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { usePageRefresh } from '@/hooks/usePageRefresh'

interface EmployerInfo {
  id: number
  company_name: string
  logo: string | null
  website: string | null
  location: string | null
}

interface CategoryInfo {
  id: number
  name: string
  slug: string
}

interface JobItem {
  id: number
  employer_id: number
  category_id: number
  title: string
  slug: string
  description: string
  requirements: string[]
  responsibilities: string[]
  job_type: string
  job_type_label: string
  experience_level: string
  experience_level_label: string
  location: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  is_remote: boolean
  status: string
  status_label: string
  rejection_reason?: string
  published_at?: string
  views_count: number
  applications_count: number
  created_at: string
  employer?: EmployerInfo
  category?: CategoryInfo
}

interface PaginatedJobsResponse {
  data: JobItem[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

const STATUS_TABS = [
  { id: 'all', label: 'All Jobs' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'closed', label: 'Closed' },
  { id: 'draft', label: 'Draft' },
]

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [lastPage, setLastPage] = useState<number>(1)

  // Modals state
  const [reviewJob, setReviewJob] = useState<JobItem | null>(null)
  const [rejectingJob, setRejectingJob] = useState<JobItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [deletingJob, setDeletingJob] = useState<JobItem | null>(null)
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false)

  const fetchJobs = useCallback(async (page: number, status: string, search: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const params: Record<string, string | number> = { page }
      if (status !== 'all') {
        params.status = status
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const response = await api.get('/admin/jobs', { params })
      const resData = response.data?.data ?? response.data
      const paginated: PaginatedJobsResponse = resData.data ? resData : resData

      setJobs(paginated.data || [])
      setCurrentPage(paginated.current_page || 1)
      setLastPage(paginated.last_page || 1)
    } catch (err: unknown) {
      console.error('Failed to load jobs:', err)
      setError('Failed to fetch job posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(currentPage, statusFilter, searchQuery)
  }, [currentPage, statusFilter, searchQuery, fetchJobs])

  // Wire into global refresh button
  usePageRefresh(() => {
    fetchJobs(currentPage, statusFilter, searchQuery)
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchQuery(searchInput)
  }

  const handleStatusTabChange = (statusId: string) => {
    setStatusFilter(statusId)
    setCurrentPage(1)
  }

  const handleApprove = async (job: JobItem) => {
    try {
      setIsActionLoading(true)
      await api.post(`/admin/jobs/${job.id}/approve`)
      toast.success(`"${job.title}" approved and published successfully!`)
      if (reviewJob?.id === job.id) {
        setReviewJob(null)
      }
      fetchJobs(currentPage, statusFilter, searchQuery)
    } catch (err: unknown) {
      console.error('Failed to approve job:', err)
      toast.error('Failed to approve job post.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingJob) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting the job post.')
      return
    }

    try {
      setIsActionLoading(true)
      await api.post(`/admin/jobs/${rejectingJob.id}/reject`, {
        reason: rejectionReason.trim(),
      })
      toast.success(`"${rejectingJob.title}" rejected with feedback.`)
      setRejectingJob(null)
      setRejectionReason('')
      if (reviewJob?.id === rejectingJob.id) {
        setReviewJob(null)
      }
      fetchJobs(currentPage, statusFilter, searchQuery)
    } catch (err: unknown) {
      console.error('Failed to reject job:', err)
      toast.error('Failed to reject job post.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingJob) return
    try {
      setIsActionLoading(true)
      await api.delete(`/admin/jobs/${deletingJob.id}`)
      toast.success(`Job "${deletingJob.title}" has been deleted.`)
      setDeletingJob(null)
      if (reviewJob?.id === deletingJob.id) {
        setReviewJob(null)
      }
      fetchJobs(currentPage, statusFilter, searchQuery)
    } catch (err: unknown) {
      console.error('Failed to delete job:', err)
      toast.error('Failed to delete job post.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending_approval':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'closed':
        return 'bg-slate-200 text-slate-700 border-slate-300'
      case 'draft':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Notion Document Header */}
      <div className="border-b border-border/60 pb-5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
            💼
          </span>
          <span>Job Management / Moderation Queue</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Job Post Management
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Review, approve, reject, or remove job listings submitted across the platform.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search title or company..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border/80 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleStatusTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-muted text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm font-medium">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Table */}
      <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3">Job Title</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Type / Location</th>
                <th className="px-5 py-3">Applicants</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-muted-foreground" size={20} />
                      <p className="text-xs font-medium">Loading job listings...</p>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    <p className="text-sm font-semibold text-foreground">No job posts found</p>
                    <p className="text-xs mt-1">Try clearing filters or adjusting your search term.</p>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground max-w-[220px] truncate">
                      {job.title}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground font-medium">
                      {job.employer?.company_name || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {job.category?.name || "General"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <span>{job.job_type_label || job.job_type}</span>
                      {job.location && (
                        <span className="block text-[10px] text-muted-foreground/80 mt-0.5">{job.location}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-foreground">
                      {job.applications_count}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${getStatusBadge(
                          job.status
                        )}`}
                      >
                        {job.status_label || job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review/View Modal Trigger */}
                        <button
                          onClick={() => setReviewJob(job)}
                          title="Review Job Details"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Approve Action (Only for pending) */}
                        {job.status === "pending_approval" && (
                          <button
                            onClick={() => handleApprove(job)}
                            disabled={isActionLoading}
                            title="Approve & Publish"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {/* Reject Action (Only for pending) */}
                        {job.status === "pending_approval" && (
                          <button
                            onClick={() => {
                              setRejectingJob(job)
                              setRejectionReason("")
                            }}
                            disabled={isActionLoading}
                            title="Reject Job"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        )}

                        {/* Remove / Delete Action */}
                        <button
                          onClick={() => setDeletingJob(job)}
                          disabled={isActionLoading}
                          title="Remove Job Listing"
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {lastPage > 1 && (
          <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
              <span className="font-semibold text-foreground">{lastPage}</span>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 border border-border/70 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                disabled={currentPage === lastPage || isLoading}
                className="p-1.5 border border-border/70 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border p-6 space-y-5 text-foreground">
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getStatusBadge(reviewJob.status)}`}>
                  {reviewJob.status_label || reviewJob.status}
                </span>
                <h3 className="text-xl font-bold text-foreground">{reviewJob.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-foreground">{reviewJob.employer?.company_name || "N/A"}</span>
                </p>
              </div>

              <button
                onClick={() => setReviewJob(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rejection notice if present */}
            {reviewJob.status === "rejected" && reviewJob.rejection_reason && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs">
                <p className="font-bold">Rejection Feedback:</p>
                <p className="mt-1">{reviewJob.rejection_reason}</p>
              </div>
            )}

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 p-4 rounded-xl text-xs border border-border/60">
              <div>
                <span className="text-muted-foreground text-[10px] block uppercase font-medium">Job Type</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Briefcase size={13} className="text-blue-600 dark:text-blue-400" />
                  {reviewJob.job_type_label || reviewJob.job_type}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[10px] block uppercase font-medium">Location</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                  {reviewJob.location || (reviewJob.is_remote ? "Remote" : "On-site")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[10px] block uppercase font-medium">Salary</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400" />
                  {reviewJob.salary_min && reviewJob.salary_max
                    ? `${reviewJob.salary_min.toLocaleString()} - ${reviewJob.salary_max.toLocaleString()} ${reviewJob.salary_currency}`
                    : "Negotiable"}
                </span>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Job Description</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {reviewJob.description}
              </p>
            </div>

            {/* Requirements */}
            {reviewJob.requirements && reviewJob.requirements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Requirements</h4>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {reviewJob.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {reviewJob.responsibilities && reviewJob.responsibilities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Responsibilities</h4>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {reviewJob.responsibilities.map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <button
                onClick={() => {
                  setDeletingJob(reviewJob)
                }}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Listing
              </button>

              <div className="flex items-center gap-2">
                {reviewJob.status === "pending_approval" && (
                  <>
                    <button
                      onClick={() => {
                        setRejectingJob(reviewJob)
                        setRejectionReason("")
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(reviewJob)}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                      Approve & Publish
                    </button>
                  </>
                )}

                <button
                  onClick={() => setReviewJob(null)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card rounded-xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-foreground">Reject Job Listing</h3>
              <button onClick={() => setRejectingJob(null)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide feedback detailing why <strong>"{rejectingJob.title}"</strong> is being rejected:
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please clarify job location requirements and salary details."
                className="w-full p-3 text-xs bg-muted/40 border border-border/80 rounded-xl outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-foreground placeholder:text-muted-foreground"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingJob(null)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card rounded-xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Delete Job Post</h3>
              <button onClick={() => setDeletingJob(null)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete the job post <strong>"{deletingJob.title}"</strong>? This action will remove the listing from the platform.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isActionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
