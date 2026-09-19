import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/lib/api'
import type { EmployerNotification } from '@/types'

/**
 * Hook to consume real-time employer notification Server-Sent Events (SSE).
 *
 * Uses fetch + ReadableStream to support sending Sanctum Bearer tokens
 * in the Authorization header.
 *
 * Automatically invalidates employer notification queries on new notifications
 * and shows a toast alert.
 */
export function useEmployerRealtimeNotifications() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const abortControllerRef = useRef<AbortController | null>(null)
  const isConnectingRef = useRef(false)

  const isEmployer = user?.role === 'employer'

  useEffect(() => {
    if (!isEmployer || !token) {
      return
    }

    // Prevent duplicate concurrent stream connections
    if (isConnectingRef.current) {
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    isConnectingRef.current = true

    const connectStream = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employer/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) {
          isConnectingRef.current = false
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() ?? ''

          for (const chunk of lines) {
            const trimmed = chunk.trim()
            if (!trimmed || !trimmed.startsWith('data:')) continue

            const dataString = trimmed.replace(/^data:\s*/, '')
            if (!dataString) continue

            try {
              const notification: EmployerNotification = JSON.parse(dataString)

              queryClient.setQueryData(
                ['employer-notifications-unread-count'],
                (prev: number = 0) => prev + 1
              )

              queryClient.invalidateQueries({ queryKey: ['employer-notifications'] })

              const title = notification.data?.title ?? 'New Notification'
              const message = notification.data?.message
              const actionUrl = notification.data?.action_url

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

    connectStream()

    return () => {
      abortController.abort()
      abortControllerRef.current = null
      isConnectingRef.current = false
    }
  }, [isEmployer, token, queryClient, navigate])
}
