import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegisterPage from './RegisterPage'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    register: vi.fn(),
    isLoading: false,
    isAuthenticated: false,
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    setToken: vi.fn(),
  })),
}))

const renderRegisterPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form', () => {
    renderRegisterPage()

    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders sign in link', () => {
    renderRegisterPage()

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toHaveAttribute('href', '/login')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')

    const form = screen.getByRole('button', { name: /sign up/i }).closest('form')!
    fireEvent.submit(form)

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
  })

  it('validates password minimum length', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText('Password'), 'short')
    await user.tab()

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'different')
    await user.tab()

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockRegister = vi.fn().mockResolvedValue(undefined)

    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
      setToken: vi.fn(),
    })

    renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      role: 'employee',
      password: 'password123',
      password_confirmation: 'password123',
    })
  })

  it('transitions to OTP verification step and allows submitting code', async () => {
    const user = userEvent.setup()
    const mockRegister = vi.fn().mockResolvedValue(undefined)

    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
      setToken: vi.fn(),
    })

    renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Username'), 'janedoe')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText(/verify your email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled()
  })
})
