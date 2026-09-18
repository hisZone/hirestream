import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyApplicationsPage from './MyApplicationsPage'
import api from '@/lib/api'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
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

describe('MyApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })
  })

  it('loads applications from the employee route', async () => {
    render(<MyApplicationsPage />, { wrapper })

    await waitFor(() => {
      expect(vi.mocked(api.get)).toHaveBeenCalledWith('/employee/applications')
    })
  })

  it('handles paginated response object structure without throwing TypeError on filter', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Applications retrieved successfully',
        data: {
          current_page: 1,
          data: [
            {
              id: 1,
              status: 'submitted',
              created_at: '2026-09-12T10:00:00.000000Z',
              job_post: {
                id: 10,
                title: 'Software Engineer',
                slug: 'software-engineer',
                job_type_label: 'Full-time',
                location: 'Remote',
                salary_min: 50000,
                salary_max: 80000,
                salary_currency: 'ETB',
                employer: { company_name: 'Tech Corp' },
              },
            },
          ],
        },
      },
    })

    render(<MyApplicationsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp • Remote • 50,000 – 80,000 ETB')).toBeInTheDocument()
    })
  })
})
