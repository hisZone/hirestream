import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InterviewCountdown } from './InterviewCountdown'

describe('InterviewCountdown', () => {
  it('renders future interview countdown badge', () => {
    // 2 days in the future
    const futureDate = new Date(Date.now() + 2 * 24 * 3600 * 1000 + 3600 * 1000).toISOString()

    render(<InterviewCountdown scheduledAt={futureDate} variant="badge" />)

    expect(screen.getByText(/In 2d/i)).toBeDefined()
  })

  it('renders interview concluded when date is in past', () => {
    // 2 hours ago with 30m duration
    const pastDate = new Date(Date.now() - 2 * 3600 * 1000).toISOString()

    render(<InterviewCountdown scheduledAt={pastDate} durationMinutes={30} variant="badge" />)

    expect(screen.getByText(/Interview Concluded/i)).toBeDefined()
  })

  it('renders interview in progress when within duration', () => {
    // Started 5 minutes ago with 45m duration
    const liveDate = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    render(<InterviewCountdown scheduledAt={liveDate} durationMinutes={45} variant="badge" />)

    expect(screen.getByText(/Interview In Progress Now/i)).toBeDefined()
  })

  it('renders card variant with digital timer breakdown', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()

    render(<InterviewCountdown scheduledAt={futureDate} variant="card" />)

    expect(screen.getByText(/days/i)).toBeDefined()
    expect(screen.getByText(/hrs/i)).toBeDefined()
    expect(screen.getByText(/mins/i)).toBeDefined()
    expect(screen.getByText(/secs/i)).toBeDefined()
  })
})
