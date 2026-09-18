import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JobSearchPage from './JobSearchPage'
import api from '@/lib/api'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('@/components/employee/EmployeeSidebar', () => ({
  default: () => <div>Sidebar</div>,
}))

vi.mock('@/components/employer/EmployerHeader', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('JobSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.startsWith('/jobs')) {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Published job listings retrieved successfully',
            data: {
              data: [
                {
                  id: 1,
                  title: 'Senior Frontend Engineer',
                  slug: 'senior-frontend-engineer',
                  description: 'Work with React and TypeScript.',
                  job_type_label: 'Full Time',
                  experience_level_label: 'Senior Level',
                  salary_min: 60000,
                  salary_max: 90000,
                  salary_currency: 'USD',
                  location: 'San Francisco, CA',
                  is_remote: true,
                  employer: { company_name: 'Acme Corp' },
                },
              ],
              meta: { current_page: 1, total: 1 },
            },
          },
        })
      }
      if (url.startsWith('/employee/applications')) {
        return Promise.resolve({ data: { data: [] } })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('renders without error when API returns paginated structure and displays jobs', async () => {
    render(<JobSearchPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })
  })

  it('handles empty jobs response cleanly', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.startsWith('/jobs')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { data: [] },
          },
        })
      }
      return Promise.resolve({ data: { data: [] } })
    })

    render(<JobSearchPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('jobs.noJobs')).toBeInTheDocument()
    })
  })
})
