import api from '@/lib/api'
import type { InterviewItem, InterviewType } from '@/types'

export interface ScheduleInterviewPayload {
  title?: string
  type: InterviewType
  scheduled_at: string
  duration_minutes: number
  timezone?: string
  meeting_link?: string
  location?: string
  notes?: string
}

export const interviewService = {
  /**
   * Schedule or reschedule an interview for an application (Employer)
   */
  async schedule(applicationId: number, payload: ScheduleInterviewPayload): Promise<InterviewItem> {
    const response = await api.post(`/employer/applications/${applicationId}/interview`, payload)
    return response.data?.data ?? response.data
  },

  /**
   * Retrieve interview details for an application (Employer or Employee)
   */
  async getByApplication(applicationId: number, isEmployee = false): Promise<InterviewItem> {
    const prefix = isEmployee ? '/employee' : '/employer'
    const response = await api.get(`${prefix}/applications/${applicationId}/interview`)
    return response.data?.data ?? response.data
  },

  /**
   * Cancel an interview (Employer)
   */
  async cancel(applicationId: number): Promise<void> {
    await api.delete(`/employer/applications/${applicationId}/interview`)
  },
}
