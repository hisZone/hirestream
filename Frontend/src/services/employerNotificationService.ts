import api from '@/lib/api'
import type { ApiResponse, EmployerNotification } from '@/types'

export interface GetEmployerNotificationsParams {
  unread?: boolean
  page?: number
  per_page?: number
}

export interface PaginatedEmployerNotifications {
  data: EmployerNotification[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export const employerNotificationService = {
  /**
   * Fetch paginated list of notifications for employer.
   */
  async getNotifications(params?: GetEmployerNotificationsParams): Promise<PaginatedEmployerNotifications> {
    const response = await api.get<ApiResponse<PaginatedEmployerNotifications>>('/employer/notifications', {
      params: {
        unread: params?.unread ? 1 : undefined,
        page: params?.page,
        per_page: params?.per_page,
      },
    })
    return response.data.data
  },

  /**
   * Get unread notification count for employer.
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ unread_count: number }>>('/employer/notifications/unread-count')
    return response.data.data.unread_count
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<EmployerNotification> {
    const response = await api.patch<ApiResponse<EmployerNotification>>(`/employer/notifications/${id}/read`)
    return response.data.data
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/employer/notifications/mark-all-read')
  },

  /**
   * Delete a single notification.
   */
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/employer/notifications/${id}`)
  },
}
