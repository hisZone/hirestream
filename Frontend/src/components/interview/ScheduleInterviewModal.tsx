import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { InterviewItem, InterviewType } from '@/types'
import { interviewService } from '@/services/interviewService'

interface ScheduleInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: number
  candidateName?: string
  jobTitle?: string
  existingInterview?: InterviewItem | null
  onSuccess: (interview: InterviewItem) => void
}

/**
 * Format a Date object to YYYY-MM-DDTHH:mm string for datetime-local input
 */
function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${y}-${m}-${d}T${h}:${min}`
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  existingInterview,
  onSuccess,
}) => {
  const [title, setTitle] = useState('Technical Interview')
  const [type, setType] = useState<InterviewType>('video')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [meetingLink, setMeetingLink] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (existingInterview) {
      setTitle(existingInterview.title || 'Technical Interview')
      setType(existingInterview.type || 'video')
      if (existingInterview.scheduled_at) {
        setScheduledAt(toLocalDatetimeInput(new Date(existingInterview.scheduled_at)))
      }
      setDurationMinutes(existingInterview.duration_minutes || 45)
      setMeetingLink(existingInterview.meeting_link || '')
      setLocation(existingInterview.location || '')
      setNotes(existingInterview.notes || '')
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      setScheduledAt(toLocalDatetimeInput(tomorrow))
      setTitle('Initial Technical Interview')
      setType('video')
      setDurationMinutes(45)
      setMeetingLink('')
      setLocation('')
      setNotes('')
    }
    setErrorMessage(null)
  }, [existingInterview, isOpen])

  if (!isOpen) return null

  // Minimum selectable date: now + 5 minutes
  const minDatetime = toLocalDatetimeInput(new Date(Date.now() + 5 * 60000))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!scheduledAt) {
      setErrorMessage('Please select a valid date and time for the interview.')
      return
    }

    const selectedTime = new Date(scheduledAt).getTime()
    if (selectedTime <= Date.now()) {
      setErrorMessage('Interview schedule time must be in the future.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await interviewService.schedule(applicationId, {
        title: title.trim(),
        type,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(durationMinutes),
        meeting_link: type === 'video' ? meetingLink.trim() || undefined : undefined,
        location: type === 'in_person' ? location.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
      })

      onSuccess(res)
      onClose()
    } catch (err: unknown) {
      console.error('Failed to schedule interview:', err)
      const errObj = err as { response?: { data?: { message?: string } } }
      setErrorMessage(
        errObj.response?.data?.message || 'Failed to schedule interview. Please check your inputs.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-muted/20">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-foreground" />
              {existingInterview ? 'Reschedule Interview' : 'Schedule Candidate Interview'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {candidateName ? `Candidate: ${candidateName}` : ''}
              {candidateName && jobTitle ? ' • ' : ''}
              {jobTitle ? `Role: ${jobTitle}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Interview Title / Stage</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Technical Round 1, System Design, Final Chat"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
          </div>

          {/* Interview Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Interview Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('video')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'video'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video Call
              </button>
              <button
                type="button"
                onClick={() => setType('in_person')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'in_person'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                On-Site
              </button>
              <button
                type="button"
                onClick={() => setType('phone')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'phone'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Phone
              </button>
            </div>
          </div>

          {/* Date & Time and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-foreground" />
                Date & Start Time
              </label>
              <input
                type="datetime-local"
                min={minDatetime}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-foreground" />
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              >
                <option value={15}>15 minutes (Quick chat)</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes (Standard)</option>
                <option value={60}>60 minutes (1 hour)</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Type Specific Fields */}
          {type === 'video' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                Meeting Link (Google Meet, Zoom, MS Teams)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>
          )}

          {type === 'in_person' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Office Location / Room Address
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Headquarters, 4th Floor, Conference Room B"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>
          )}

          {/* Notes for Candidate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Candidate Preparation Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide agenda, interviewers names, links to review, or required equipment..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-none"
            />
          </div>

          <div className="p-3 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <span>
              The candidate will automatically receive a real-time notification with countdown
              timer and calendar integration once confirmed.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {existingInterview ? 'Update Schedule' : 'Confirm & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default ScheduleInterviewModal
