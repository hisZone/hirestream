import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Briefcase,
  MapPin,
  FileText,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Save,
  Send,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

import EmployerSidebar from '@/components/employer/EmployerSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

type JobForm = {
  title: string
  category: string
  employmentType: string
  positions: string
  location: string
  workMode: string
  description: string
  responsibilities: string
  requirements: string
  deadline: string
  status: string
}

const initialJob: JobForm = {
  title: 'Senior React Developer',
  category: 'Technology',
  employmentType: 'Full-time',
  positions: '2',
  location: 'Addis Ababa, Ethiopia',
  workMode: 'On-site',
  description:
    'We are looking for a Senior React Developer to build and maintain modern web applications for our growing technology team.',
  responsibilities:
    'Develop React applications, collaborate with designers and backend developers, review code, and maintain application performance.',
  requirements:
    '3+ years of React experience, strong JavaScript and TypeScript knowledge, Git experience, and good communication skills.',
  deadline: '2026-08-30',
  status: 'Open',
}

export default function EditJobPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const jobIdParam = searchParams.get('jobId')
  const jobId = jobIdParam ? Number(jobIdParam) : null

  const [job, setJob] = useState<JobForm>(initialJob)
  const [savedJob, setSavedJob] = useState<JobForm>(initialJob)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [jobStatusRaw, setJobStatusRaw] = useState<string>('draft')
  const [message, setMessage] = useState('')
  const [isClosed, setIsClosed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResubmitting, setIsResubmitting] = useState(false)

  // Fetch real job data if jobId provided
  useEffect(() => {
    if (!jobId) return

    let isMounted = true
    async function loadJobData() {
      try {
        setIsLoading(true)
        const res = await api.get('/employer/jobs')
        const data = res.data?.data?.data || res.data?.data
        if (Array.isArray(data)) {
          const found = data.find((j: any) => j.id === jobId)
          if (found && isMounted) {
            setJobStatusRaw((found.status || '').toLowerCase())
            setRejectionReason(found.rejection_reason || null)
            const closed = (found.status || '').toLowerCase() === 'closed'
            setIsClosed(closed)

            const loadedForm: JobForm = {
              title: found.title || '',
              category: found.category?.name || 'Technology',
              employmentType: found.job_type_label || (found.job_type === 'full_time' ? 'Full-time' : found.job_type || 'Full-time'),
              positions: found.positions ? String(found.positions) : '1',
              location: found.location || 'Remote',
              workMode: found.is_remote ? 'Remote' : 'On-site',
              description: found.description || '',
              responsibilities: Array.isArray(found.responsibilities)
                ? found.responsibilities.join('\n')
                : found.responsibilities || '',
              requirements: Array.isArray(found.requirements)
                ? found.requirements.join('\n')
                : found.requirements || '',
              deadline: found.deadline ? found.deadline.split('T')[0] : '2026-08-30',
              status: closed ? 'Closed' : 'Open',
            }

            setJob(loadedForm)
            setSavedJob(loadedForm)
          }
        }
      } catch (err) {
        console.error('Failed to load job post details:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadJobData()

    return () => {
      isMounted = false
    }
  }, [jobId])

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target

    setJob((currentJob) => ({
      ...currentJob,
      [name]: value,
    }))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isClosed) {
      setMessage('This job is closed and cannot be edited.')
      setTimeout(() => {
        setMessage('')
      }, 3000)
      return
    }

    try {
      if (jobId) {
        await api.put(`/employer/jobs/${jobId}`, {
          title: job.title,
          location: job.location,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          deadline: job.deadline,
        })
      }
      setSavedJob(job)
      setMessage('Job changes saved successfully.')
      toast.success('Job changes saved successfully.')
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save job changes.'
      setMessage(errorMsg)
      toast.error(errorMsg)
    }
  }

  async function handleResubmitForReview() {
    if (!jobId) return

    try {
      setIsResubmitting(true)
      // First save latest edits
      await api.put(`/employer/jobs/${jobId}`, {
        title: job.title,
        location: job.location,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        deadline: job.deadline,
      })

      // Submit for admin review
      await api.post(`/employer/jobs/${jobId}/submit`)
      toast.success('Job post updated and resubmitted for admin review!')
      setJobStatusRaw('pending_approval')
      setRejectionReason(null)
      setTimeout(() => {
        navigate('/my-job-posts')
      }, 1200)
    } catch (err: any) {
      console.error('Failed to resubmit job post:', err)
      toast.error(err.response?.data?.message || 'Failed to resubmit job post.')
    } finally {
      setIsResubmitting(false)
    }
  }

  function handleCancel() {
    setJob(savedJob)
    setMessage('Changes have been cancelled.')
    setTimeout(() => {
      navigate('/my-job-posts')
    }, 1000)
  }

  async function handleCloseJob() {
    const confirmed = window.confirm(
      'Are you sure you want to close this job? New applications will no longer be accepted.',
    )

    if (!confirmed) {
      return
    }

    try {
      if (jobId) {
        await api.post(`/employer/jobs/${jobId}/close`)
      }
      setIsClosed(true)
      setJob((currentJob) => ({
        ...currentJob,
        status: 'Closed',
      }))
      setSavedJob((currentJob) => ({
        ...currentJob,
        status: 'Closed',
      }))
      setMessage('Job has been closed successfully.')
      toast.success('Job has been closed.')
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to close job.')
    }
  }

  const isRejected = jobStatusRaw === 'rejected'

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployerSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title="Edit Job" />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion Document Header */}
          <div className="border-b border-border/60 pb-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Link
                  to="/my-job-posts"
                  className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to My Job Posts</span>
                </Link>
                <span>/</span>
                <span>Edit Listing</span>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium self-start sm:self-auto ${
                  isClosed
                    ? 'bg-muted text-muted-foreground border border-border'
                    : isRejected
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isClosed ? 'Closed' : isRejected ? 'Rejected' : 'Active'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Edit Job Post
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Update position details, requirements, compensation, or address admin feedback.
                </p>
              </div>

              {isRejected && jobId && (
                <Button
                  size="sm"
                  disabled={isResubmitting}
                  onClick={handleResubmitForReview}
                  className="rounded-lg h-8 px-3.5 text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 self-start sm:self-auto gap-1.5"
                >
                  {isResubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Save & Resubmit for Review
                </Button>
              )}
            </div>
          </div>

          {/* Rejection Feedback Alert Box */}
          {isRejected && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-3 text-rose-900 dark:text-rose-200">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                    Admin Rejection Confirmation Message & Feedback
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    The administrator reviewed this job listing and rejected it with the following note:
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-background/80 dark:bg-card/90 border border-rose-500/20 text-xs leading-relaxed text-foreground font-medium">
                {rejectionReason || 'No detailed reason was provided by the administrator.'}
              </div>

              <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90">
                💡 <strong>Next steps:</strong> Review the issues raised above, make the necessary corrections in the form below, and click <strong>Save & Resubmit for Review</strong>.
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading job post details...</span>
            </div>
          )}

          {/* Message Alert */}
          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
                isClosed
                  ? 'border-border bg-muted/40 text-muted-foreground'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isClosed ? (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSave}>
            {/* Basic Information */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                    Job Title <span className="text-rose-500">*</span>
                  </Label>
                  <input
                    id="title"
                    name="title"
                    value={job.title}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                    Job Category <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="category"
                    name="category"
                    value={job.category}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option>Technology</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Finance</option>
                    <option>Human Resources</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employmentType" className="text-xs font-medium text-muted-foreground">
                    Employment Type <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={job.employmentType}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="positions" className="text-xs font-medium text-muted-foreground">
                    Available Positions <span className="text-rose-500">*</span>
                  </Label>
                  <input
                    id="positions"
                    name="positions"
                    type="number"
                    min="1"
                    value={job.positions}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Location & Work Mode</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs font-medium text-muted-foreground">
                    Location <span className="text-rose-500">*</span>
                  </Label>
                  <input
                    id="location"
                    name="location"
                    value={job.location}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workMode" className="text-xs font-medium text-muted-foreground">Work Location</Label>
                  <select
                    id="workMode"
                    name="workMode"
                    value={job.workMode}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option>On-site</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-foreground">Job Details</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                    Job Description <span className="text-rose-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={job.description}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full resize-none rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="responsibilities" className="text-xs font-medium text-muted-foreground">
                    Responsibilities <span className="text-rose-500">*</span>
                  </Label>
                  <textarea
                    id="responsibilities"
                    name="responsibilities"
                    rows={4}
                    value={job.responsibilities}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full resize-none rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requirements" className="text-xs font-medium text-muted-foreground">
                    Requirements <span className="text-rose-500">*</span>
                  </Label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={4}
                    value={job.requirements}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full resize-none rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Application Deadline & Status</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-xs font-medium text-muted-foreground">
                    Application Deadline <span className="text-rose-500">*</span>
                  </Label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={job.deadline}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Applications will close automatically after this date.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Job Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={job.status}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Close warning / status notice */}
            {!isClosed ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Listing is Active</p>
                  <p className="mt-0.5 text-amber-700/90 dark:text-amber-400/90">
                    Closing this job post will hide it from the search directory and reject any new candidate submissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-xs text-muted-foreground flex items-start gap-2.5">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">This job is closed</p>
                  <p className="mt-0.5">New applications are no longer accepted.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="rounded-lg h-8 px-3 text-xs"
              >
                Cancel
              </Button>

              {!isClosed && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleCloseJob}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  Close Job Post
                </Button>
              )}

              {!isClosed && isRejected && jobId && (
                <Button
                  type="button"
                  size="sm"
                  disabled={isResubmitting}
                  onClick={handleResubmitForReview}
                  className="rounded-lg h-8 px-3.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  {isResubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Save & Resubmit
                </Button>
              )}

              {!isClosed && (
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-lg h-8 px-3.5 text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
