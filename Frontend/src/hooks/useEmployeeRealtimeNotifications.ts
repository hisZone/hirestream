import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import type { EmployeeNotification } from '@/services/employeeNotificationService'

export function useEmployeeRealtimeNotifications() {
  const { user, token, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)
  const isConnectingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employee' || !token) {
      return
    }

    let isActive = true

    const connectToStream = async () => {
      if (!isActive || isConnectingRef.current) return
      isConnectingRef.current = true

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/v1/employee/notifications/stream', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`SSE stream failed with status ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        isConnectingRef.current = false

        while (isActive) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() ?? ''

          for (const chunk of lines) {
            if (!chunk.trim()) continue

            const eventMatch = chunk.match(/^event:\s*(.+)$/m)
            const dataMatch = chunk.match(/^data:\s*(.+)$/m)

            const eventType = eventMatch ? eventMatch[1].trim() : 'message'
            const eventData = dataMatch ? dataMatch[1].trim() : ''

            if (eventType === 'notification' && eventData) {
              try {
                const notification = JSON.parse(eventData) as EmployeeNotification

                // Immediately update unread count badge
                if (typeof notification.unread_count === 'number') {
                  queryClient.setQueryData(['employee-notifications-unread-count'], notification.unread_count)
                } else {
                  queryClient.invalidateQueries({ queryKey: ['employee-notifications-unread-count'] })
                }

                queryClient.invalidateQueries({ queryKey: ['employee-notifications'] })
                queryClient.invalidateQueries({ queryKey: ['employee-job-feed'] })

                // Display interactive toast
                const { title, message, action_url } = notification.data

                toast(title || 'New Notification', {
                  description: message,
                  action: action_url
                    ? {
                        label: 'View',
                        onClick: () => navigate(action_url),
                      }
                    : undefined,
                  duration: 6000,
                })
              } catch (e) {
                console.error('Failed to parse SSE notification payload:', e)
              }
            }
          }
        }
      } catch (err: unknown) {
        isConnectingRef.current = false
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        if (isActive) {
          setTimeout(() => {
            if (isActive) connectToStream()
          }, 6000)
        }
      }
    }

    connectToStream()

    return () => {
      isActive = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isAuthenticated, user?.role, token, queryClient, navigate])
}
