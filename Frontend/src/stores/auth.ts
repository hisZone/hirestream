import { create } from 'zustand'
import api from '@/lib/api'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types'
import i18n from '@/i18n'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<User>
  register: (data: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
  getProfile: () => Promise<User | null>
  initialize: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isInitialized: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (data: LoginRequest): Promise<User> => {
    set({ isLoading: true })
    try {
      const response = await api.post('/login', data)
      const resData = response.data
      const authData: AuthResponse = resData.data ?? resData
      const user = (authData.user ?? (authData as unknown as User)) as User
      const access_token = authData.access_token ?? resData.access_token
      localStorage.setItem('token', access_token)
      set({ user, token: access_token, isAuthenticated: true, isLoading: false, isInitialized: true })
      return user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (data: RegisterRequest): Promise<User> => {
    set({ isLoading: true })
    try {
      const response = await api.post('/register', data)
      const resData = response.data
      const authData: AuthResponse = resData.data ?? resData
      const user = (authData.user ?? (authData as unknown as User)) as User
      const access_token = authData.access_token ?? resData.access_token
      localStorage.setItem('token', access_token)
      set({ user, token: access_token, isAuthenticated: true, isLoading: false, isInitialized: true })
      return user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
      document.documentElement.classList.remove('dark', 'light')
      await i18n.changeLanguage('en')
      localStorage.removeItem('language')
    }
  },

  getProfile: async (): Promise<User | null> => {
    set({ isLoading: true })
    try {
      const response = await api.get('/profile')
      const resData = response.data
      const userData: User = resData.data?.user ?? resData.data ?? resData.user ?? resData
      set({ user: userData, isLoading: false })
      return userData
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  initialize: async () => {
    if (get().isInitialized) return
    try {
      if (get().token) {
        await get().getProfile()
      }
      set({ isInitialized: true })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
    }
  },

  hasRole: (roles: string | string[]): boolean => {
    const user = get().user
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    set({ token, isAuthenticated: true })
  },
}))
