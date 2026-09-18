import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, CheckCircle2, XCircle, Calendar, Sparkles, Clock, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { employeeNotificationService, type EmployeeNotification } from '@/services/employeeNotificationService'

export default function EmployeeNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['employee-notifications-unread-count'],
    queryFn: () => employeeNotificationService.getUnreadCount(),
    refetchInterval: 30000,
  })

  // Fetch paginated notifications
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['employee-notifications', activeTab],
    queryFn: () => employeeNotificationService.getNotifications({ unread: activeTab === 'unread', per_page: 20 }),
    enabled: isOpen,
  })

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => employeeNotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-notifications-unread-count'] })
    },
  })

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => employeeNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['employee-notifications-unread-count'], 0)
      queryClient.invalidateQueries({ queryKey: ['employee-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeNotificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-notifications-unread-count'] })
      toast.success('Notification deleted')
    },
    onError: () => {
      toast.error('Failed to delete notification')
    },
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = (notification: EmployeeNotification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }

    setIsOpen(false)

    const targetUrl = notification.data.action_url
    if (targetUrl) {
      navigate(targetUrl)
    }
  }

  const notifications = notificationsData?.data ?? []

  const getNotificationIcon = (type?: string, status?: string) => {
    switch (type) {
      case 'job_match':
        return <Sparkles size={16} className="text-neutral-900 dark:text-white" />
      case 'interview_scheduled':
        return <Calendar size={16} className="text-neutral-900 dark:text-white" />
      case 'application_status_changed':
        if (status === 'hired' || status === 'shortlisted') {
          return <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
        }
        if (status === 'rejected') {
          return <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
        }
        return <Clock size={16} className="text-neutral-600 dark:text-neutral-400" />
      default:
        return <AlertCircle size={16} className="text-neutral-600 dark:text-neutral-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            refetch()
          }
        }}
        className="relative rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1 text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/40">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-neutral-900/10 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border/60 bg-muted/20 px-4 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2 text-xs font-medium border-b-2 mr-4 transition-colors ${
                activeTab === 'unread'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted rounded" />
                      <div className="h-2.5 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-xs text-rose-500">
                Failed to load notifications. Please try again.
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell size={24} className="mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground font-medium">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.is_read
                const { type, status, title, message, match_score } = notification.data

                return (
                  <div
                    key={notification.id}
                    className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      isUnread ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/20'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-md bg-muted border border-border/60">
                      {getNotificationIcon(type, status)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold leading-tight ${isUnread ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                          {title || 'Update'}
                        </p>
                        {match_score && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                            {match_score}%
                          </span>
                        )}
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {message}
                      </p>

                      <p className="text-[10px] text-muted-foreground/70">
                        {notification.created_at_human}
                      </p>
                    </div>

                    {/* Delete action button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMutation.mutate(notification.id)
                      }}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-500 transition-all"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
