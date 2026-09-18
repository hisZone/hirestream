import api from '@/lib/api'
import type { ApiResponse, JobPost } from '@/types'

export interface JobMatchReasons {
  matched_skills?: string[]
  matched_role?: string
  title_similarity?: number
  is_core_match?: boolean
  seniority_alignment?: string | null
  category_match?: boolean
  is_remote?: boolean
  matched_skills_count?: number
  [key: string]: unknown
}

export interface MatchedJobItem {
  id: number
  match_score: number
  match_reasons: JobMatchReasons
  created_at: string
  job: JobPost
  is_saved: boolean
  has_applied: boolean
}

export interface MatchedFeedResponse {
  feed: MatchedJobItem[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  profile_status: {
    is_complete: boolean
    headline: string | null
    skills_count: number
  }
}

export interface EmployeeProfileData {
  headline?: string
  phone?: string
  location?: string
  bio?: string
  skills?: string[]
  experience?: Array<{
    title?: string
    company?: string
    start_date?: string
    end_date?: string
    current?: boolean
    description?: string
  }>
  education?: Array<{
    degree?: string
    field?: string
    institution?: string
    year?: string
  }>
  languages?: any[]
  preferred_job_type?: string
}

export interface EmployeeProfileResponse {
  profile: EmployeeProfileData | null
  completion: {
    is_complete: boolean
    percentage: number
    missing_fields: string[]
  }
}

export interface FeedQueryParams {
  min_score?: number
  is_remote?: boolean
  page?: number
  per_page?: number
}

export const employeeFeedService = {
  /**
   * Get the employee's algorithmic recommended job feed.
   */
  async getFeed(params?: FeedQueryParams): Promise<MatchedFeedResponse> {
    const response = await api.get<ApiResponse<MatchedFeedResponse>>('/employee/feed', {
      params,
    })
    return response.data.data
  },

  /**
   * Dismiss a job from recommendations.
   */
  async dismissJob(jobPostId: number): Promise<void> {
    await api.post(`/employee/feed/${jobPostId}/dismiss`)
  },

  /**
   * Get employee profile & setup completion.
   */
  async getProfile(): Promise<EmployeeProfileResponse> {
    const response = await api.get<ApiResponse<EmployeeProfileResponse>>('/employee/profile')
    return response.data.data
  },

  /**
   * Update employee profile and trigger background queue worker matching.
   */
  async updateProfile(data: EmployeeProfileData): Promise<EmployeeProfileResponse> {
    const response = await api.put<ApiResponse<EmployeeProfileResponse>>('/employee/profile', data)
    return response.data.data
  },
}
