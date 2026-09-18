import api from '@/lib/api'
import type { AdminNotification, ApiResponse } from '@/types'

export interface PaginatedNotifications {
  data: AdminNotification[]
  current_page: number
  last_page: number
  total: number
}

export const adminNotificationService = {
  async getNotifications(params?: { unread?: boolean; per_page?: number; page?: number }): Promise<PaginatedNotifications> {
    const response = await api.get<ApiResponse<PaginatedNotifications>>('/admin/notifications', { params })
    return response.data.data
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ unread_count: number }>>('/admin/notifications/unread-count')
    return response.data.data.unread_count
  },

  async markAsRead(id: string): Promise<AdminNotification> {
    const response = await api.patch<ApiResponse<AdminNotification>>(`/admin/notifications/${id}/read`)
    return response.data.data
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/admin/notifications/mark-all-read')
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/admin/notifications/${id}`)
  },
}
