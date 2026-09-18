import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InterviewDetailsModal } from './InterviewDetailsModal'
import type { InterviewItem } from '@/types'

const mockInterview: InterviewItem = {
  id: 10,
  application_id: 25,
  employer_id: 4,
  user_id: 12,
  job_post_id: 8,
  title: 'Fullstack Architect Technical Interview',
  type: 'video',
  scheduled_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  duration_minutes: 60,
  meeting_link: 'https://meet.google.com/abc-defg-hij',
  location: null,
  notes: 'Prepare a 15-minute presentation on database scalability.',
  status: 'scheduled',
}

describe('InterviewDetailsModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <InterviewDetailsModal
        isOpen={false}
        onClose={() => {}}
        interview={mockInterview}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with interview title, date, notes and join call button when open', () => {
    render(
      <InterviewDetailsModal
        isOpen={true}
        onClose={() => {}}
        interview={mockInterview}
        companyName="Stripe Technologies"
        jobTitle="Senior Laravel Engineer"
      />
    )

    expect(screen.getByText('Fullstack Architect Technical Interview')).toBeDefined()
    expect(screen.getByText('Stripe Technologies')).toBeDefined()
    expect(screen.getByText('Senior Laravel Engineer')).toBeDefined()
    expect(screen.getByText(/Prepare a 15-minute presentation/i)).toBeDefined()
    expect(screen.getByText('Join Video Call')).toBeDefined()
    expect(screen.getByText('Google Calendar')).toBeDefined()
    expect(screen.getByText('Download .iCal')).toBeDefined()
  })

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn()
    render(
      <InterviewDetailsModal
        isOpen={true}
        onClose={handleClose}
        interview={mockInterview}
      />
    )

    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
