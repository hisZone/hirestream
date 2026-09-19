import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    isLoading: false,
    isAuthenticated: false,
  })),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toHaveAttribute('href', '/register')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email or username is required')).toBeInTheDocument()
    expect(await screen.findByText('Password is required')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValue({
      id: 1,
      email: 'john@example.com',
      role: 'employee',
      email_verified_at: '2026-09-19T00:00:00.000Z',
    })

    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      logout: vi.fn(),
      getProfile: vi.fn(),
      register: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email or username/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockLogin).toHaveBeenCalledWith({
      login: 'john@example.com',
      password: 'password123',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/my-applications')
  })

  it('redirects unverified user to /verify-email on login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValue({
      id: 1,
      email: 'john@example.com',
      role: 'employee',
      email_verified_at: null,
    })

    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      logout: vi.fn(),
      getProfile: vi.fn(),
      register: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email or username/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockLogin).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/verify-email')
  })

  it('shows loading state', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      isLoading: true,
      isAuthenticated: false,
      user: null,
      token: null,
      logout: vi.fn(),
      getProfile: vi.fn(),
      register: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })
})
