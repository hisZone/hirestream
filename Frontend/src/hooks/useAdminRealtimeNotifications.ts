import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/lib/api'
import type { AdminNotification } from '@/types'

export function useAdminRealtimeNotifications() {
  const { user, token, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)
  const isConnectingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin' || !token) {
      return
    }

    let isActive = true

    const connectToStream = async () => {
      if (!isActive || isConnectingRef.current) return
      isConnectingRef.current = true

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(`${API_BASE_URL}/admin/notifications/stream`, {
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
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const dataString = trimmed.replace(/^data:\s*/, '')
            if (!dataString) continue

            try {
              const notification: AdminNotification = JSON.parse(dataString)

              queryClient.setQueryData(
                ['admin-notifications-unread-count'],
                (prev: number = 0) => prev + 1
              )

              queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })

              const title = notification.title || notification.data?.title || 'New Notification'
              const message = notification.message || notification.data?.message
              const actionUrl = notification.action_url || notification.data?.action_url

              toast(title, {
                description: message,
                action: actionUrl
                  ? {
                      label: 'View',
                      onClick: () => navigate(actionUrl),
                    }
                  : undefined,
              })
            } catch {
              // Ignore malformed JSON chunks
            }
          }
        }
      } catch {
        // Suppress stream abort/network errors on cleanup
      } finally {
        isConnectingRef.current = false
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
