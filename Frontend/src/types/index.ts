// Re-export all model types
export * from './job'
export * from './category'
export * from './application'
export * from './user'
export type { EmployeeNotification } from '@/services/employeeNotificationService'

// Generic API response structure
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  meta?: PaginationMeta
  errors?: Record<string, string[]>
}

// Pagination metadata returned by Laravel length-aware paginator
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

// Common filter and search query parameters
export interface QueryParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  [key: string]: unknown
}

// Navigation item structure for sidebars and menus
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  disabled?: boolean
  external?: boolean
  children?: NavItem[]
}

export interface AdminNotificationData {
  type?: string
  title?: string
  message?: string
  job_post_id?: number
  job_title?: string
  employer_id?: number
  company_name?: string
  action_url?: string
  [key: string]: unknown
}

export interface AdminNotification {
  id: string
  type: string
  title?: string
  message?: string
  action_url?: string
  data: AdminNotificationData
  read_at: string | null
  is_read: boolean
  unread_count?: number
  created_at: string
  created_at_human?: string
}

export interface EmployerNotificationData {
  type?: string
  title?: string
  message?: string
  job_post_id?: number
  job_title?: string
  employer_id?: number
  company_name?: string
  application_id?: number
  applicant_name?: string
  applicant_email?: string
  action_url?: string
  rejection_reason?: string
  [key: string]: unknown
}

export interface EmployerNotification {
  id: string
  type: string
  title?: string
  message?: string
  action_url?: string
  data: EmployerNotificationData
  read_at: string | null
  is_read: boolean
  unread_count?: number
  created_at: string
  created_at_human?: string
}

export type InterviewType = 'video' | 'in_person' | 'phone'
export type InterviewStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled'

export interface InterviewSchedule {
  id: number
  job_application_id: number
  scheduled_at: string
  interview_type: InterviewType
  meeting_link?: string | null
  location?: string | null
  notes?: string | null
  status: InterviewStatus
  cancellation_reason?: string | null
  created_at: string
  updated_at: string
}
