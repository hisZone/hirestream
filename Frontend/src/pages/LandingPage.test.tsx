import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LandingPage from './LandingPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the HireStream brand and main headline', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // Brand logo and title
    expect(screen.getAllByText('HireStream').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('v2.0')).toBeInTheDocument()

    // Main headline
    expect(screen.getByText(/Where Exceptional Talent Meets/i)).toBeInTheDocument()
    expect(screen.getByText(/Verified Opportunities/i)).toBeInTheDocument()
  })

  it('submits search query and navigates to job search', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Job title, skills, or role/i)
    fireEvent.change(input, { target: { value: 'Senior Backend Developer' } })

    const submitBtn = screen.getByRole('button', { name: /Explore Roles/i })
    fireEvent.click(submitBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/job-search?search=Senior%20Backend%20Developer')
  })

  it('toggles interactive showcase tabs between Matching, Scheduler, and Pipeline', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // Initially matching tab
    expect(screen.getByText('Candidate Algorithmic Feed')).toBeInTheDocument()
    expect(screen.getByText('94% MATCH')).toBeInTheDocument()

    // Click Scheduler tab
    const schedulerTab = screen.getByRole('button', { name: /Interview Scheduler/i })
    fireEvent.click(schedulerTab)

    expect(screen.getByText('Structured Interview Suite')).toBeInTheDocument()
    expect(screen.getByText(/Interview Commences In:/i)).toBeInTheDocument()

    // Click Pipeline tab
    const pipelineTab = screen.getByRole('button', { name: /Applicant Pipeline/i })
    fireEvent.click(pipelineTab)

    expect(screen.getByText('Employer Hiring Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Alex Mercer')).toBeInTheDocument()
  })

  it('switches between candidate and employer flow tabs in How It Works', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // Initially for candidates
    expect(screen.getByText('Setup Your Profile & Upload CV')).toBeInTheDocument()

    // Switch to for employers
    const employerBtn = screen.getByRole('button', { name: /For Employers/i })
    fireEvent.click(employerBtn)

    expect(screen.getByText('Post Your Role Requirements')).toBeInTheDocument()
    expect(screen.getByText('Instant Admin Verification')).toBeInTheDocument()
  })
})
