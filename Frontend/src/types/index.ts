export type UserRole = 'admin' | 'employer' | 'employee'

export interface User {
  id: number
  name: string
  email: string
  username: string
  role: UserRole
  role_label?: string
  is_suspended?: boolean
  status?: string
  email_verified_at: string | null
  created_at?: string
  updated_at?: string
  cv_path?: string | null
  cv_original_name?: string | null
  cv_uploaded_at?: string | null
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
  expires_at?: string
}

export interface LoginRequest {
  login: string
  password: string
  remember_me?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  username: string
  password: string
  password_confirmation: string
  role: UserRole
  remember_me?: boolean
}
