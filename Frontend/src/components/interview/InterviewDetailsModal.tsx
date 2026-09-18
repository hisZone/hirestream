import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Phone,
  ExternalLink,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  Briefcase,
} from 'lucide-react'
import type { InterviewItem } from '@/types'
import { InterviewCountdown } from './InterviewCountdown'

interface InterviewDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  interview: InterviewItem
  companyName?: string
  jobTitle?: string
}

/**
 * Format Date to UTC iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function toICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate Google Calendar add event URL
 */
function getGoogleCalendarUrl(
  interview: InterviewItem,
  companyName?: string,
  jobTitle?: string,
): string {
  const start = new Date(interview.scheduled_at)
  const end = new Date(start.getTime() + interview.duration_minutes * 60000)

  const title = encodeURIComponent(
    interview.title || `Interview for ${jobTitle || 'Job Post'} with ${companyName || 'Company'}`,
  )

  const description = encodeURIComponent(
    `${interview.notes ? `Preparation Notes:\n${interview.notes}\n\n` : ''}${
      interview.meeting_link ? `Meeting Link: ${interview.meeting_link}\n` : ''
    }Scheduled via Job Listing Platform`,
  )

  const location = encodeURIComponent(interview.meeting_link || interview.location || 'Online')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toICalDate(
    start,
  )}/${toICalDate(end)}&details=${description}&location=${location}`
}

/**
 * Trigger .ICS file download
 */
function downloadIcsFile(interview: InterviewItem, companyName?: string, jobTitle?: string): void {
  const start = new Date(interview.scheduled_at)
  const end = new Date(start.getTime() + interview.duration_minutes * 60000)
  const uid = `interview-${interview.id}-${Date.now()}@jobplatform.com`

  const eventTitle =
    interview.title || `Interview with ${companyName || 'Employer'} - ${jobTitle || 'Position'}`
  const eventDesc = (
    `${interview.notes ? `${interview.notes}\\n` : ''}${
      interview.meeting_link ? `Meeting URL: ${interview.meeting_link}` : ''
    }`
  ).replace(/\n/g, '\\n')
  const loc = (interview.meeting_link || interview.location || 'Online Video Call').replace(
    /\n/g,
    ' ',
  )

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobListingPlatform//InterviewSchedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICalDate(new Date())}`,
    `DTSTART:${toICalDate(start)}`,
    `DTEND:${toICalDate(end)}`,
    `SUMMARY:${eventTitle}`,
    `DESCRIPTION:${eventDesc}`,
    `LOCATION:${loc}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `interview-${interview.id}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Visual Mini Calendar View
 */
function MiniCalendar({ scheduledDate }: { scheduledDate: Date }) {
  const [viewDate, setViewDate] = useState<Date>(
    new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), 1),
  )

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  const today = new Date()

  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
            }
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
            }
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="py-1 text-transparent">
            0
          </div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const curr = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum)
          const isInterview = isSameDay(curr, scheduledDate)
          const isToday = isSameDay(curr, today)

          return (
            <div
              key={`day-${dayNum}`}
              className={`py-1.5 rounded-md font-medium transition-all ${
                isInterview
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold ring-2 ring-neutral-900 dark:ring-white ring-offset-1 dark:ring-offset-background shadow-xs'
                  : isToday
                  ? 'border border-primary text-primary font-semibold'
                  : 'text-foreground hover:bg-muted/60'
              }`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 pt-2.5 border-t border-border/60 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white" />
          Interview Date
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-primary" />
          Today
        </span>
      </div>
    </div>
  )
}

export const InterviewDetailsModal: React.FC<InterviewDetailsModalProps> = ({
  isOpen,
  onClose,
  interview,
  companyName,
  jobTitle,
}) => {
  if (!isOpen) return null

  const scheduledDate = new Date(interview.scheduled_at)
  const endDate = new Date(scheduledDate.getTime() + interview.duration_minutes * 60000)

  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedStartTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const formattedEndTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border/70 bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                Interview Confirmed
              </span>
              <span className="text-xs text-muted-foreground uppercase font-mono">
                {interview.type === 'video'
                  ? 'Video Meeting'
                  : interview.type === 'in_person'
                  ? 'On-Site Interview'
                  : 'Phone Interview'}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {interview.title || 'Scheduled Interview'}
            </h2>
            {(companyName || jobTitle) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                {companyName && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {companyName}
                  </span>
                )}
                {jobTitle && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    {jobTitle}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Live Countdown Display */}
          <div className="bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Time Until Interview
              </div>
              <p className="text-xs text-muted-foreground">
                Please be ready 5 minutes prior to start time.
              </p>
            </div>
            <InterviewCountdown
              scheduledAt={interview.scheduled_at}
              durationMinutes={interview.duration_minutes}
              variant="card"
            />
          </div>

          {/* Grid Layout: Calendar & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Interactive Mini Calendar */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Schedule Calendar
              </span>
              <MiniCalendar scheduledDate={scheduledDate} />
            </div>

            {/* Right: Meeting Specs & Timings */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Session Details
                </span>

                <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-4 h-4 text-foreground mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{formattedDate}</div>
                      <div className="text-xs text-muted-foreground">
                        {formattedStartTime} – {formattedEndTime} ({interview.duration_minutes} mins)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {interview.type === 'video' ? (
                      <Video className="w-4 h-4 text-blue-600 mt-0.5" />
                    ) : interview.type === 'in_person' ? (
                      <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                    ) : (
                      <Phone className="w-4 h-4 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {interview.type === 'video'
                          ? 'Video Conference'
                          : interview.type === 'in_person'
                          ? 'In-Person Location'
                          : 'Phone Discussion'}
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        {interview.meeting_link ? (
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:text-primary/80"
                          >
                            {interview.meeting_link}
                          </a>
                        ) : interview.location ? (
                          interview.location
                        ) : (
                          'Instructions provided below'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {interview.meeting_link && (
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 font-semibold text-sm shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Video className="w-4 h-4" />
                    Join Video Call
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getGoogleCalendarUrl(interview, companyName, jobTitle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-sm"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                    Google Calendar
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(interview, companyName, jobTitle)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    Download .iCal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preparation / Instructions Notes */}
          {interview.notes && (
            <div className="bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Info className="w-4 h-4 text-foreground" />
                Notes & Preparation Instructions
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed pl-5">
                {interview.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/70 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
export default InterviewDetailsModal
