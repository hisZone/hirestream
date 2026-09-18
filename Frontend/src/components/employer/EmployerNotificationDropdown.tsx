import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Users,
  BriefcaseBusiness,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { employerNotificationService } from '@/services/employerNotificationService'
import type { EmployerNotification } from '@/types'

export default function EmployerNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Poll unread count every 30 seconds as background fallback
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['employer-notifications-unread-count'],
    queryFn: () => employerNotificationService.getUnreadCount(),
    refetchInterval: 30000,
  })

  // Fetch notifications list
  const {
    data: notificationsData,
    isLoading,
  } = useQuery({
    queryKey: ['employer-notifications', filterUnread],
    queryFn: () => employerNotificationService.getNotifications({ unread: filterUnread || undefined, per_page: 15 }),
    refetchInterval: isOpen ? 15000 : 30000,
  })

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => employerNotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employer-notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Failed to mark notification as read')
    },
  })

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => employerNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['employer-notifications-unread-count'], 0)
      queryClient.invalidateQueries({ queryKey: ['employer-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employer-notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employerNotificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employer-notifications-unread-count'] })
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

  const handleNotificationClick = (notification: EmployerNotification) => {
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

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'job_post_approved':
      case 'employer_approved':
        return <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
      case 'job_post_rejected':
      case 'employer_rejected':
        return <XCircle size={18} className="text-rose-600 dark:text-rose-400" />
      case 'new_application_received':
        return <Users size={18} className="text-blue-600 dark:text-blue-400" />
      default:
        return <BriefcaseBusiness size={18} className="text-slate-600 dark:text-slate-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-red-600 text-white text-[11px] font-bold rounded-full border-2 border-background shadow-sm ring-1 ring-red-500/20 animate-pulse"
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-border px-4 py-2 bg-background text-xs gap-2">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !filterUnread
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterUnread
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground">
                  {filterUnread ? 'No unread notifications right now' : 'You are all caught up!'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex gap-3 transition-colors hover:bg-muted/60 cursor-pointer relative group ${
                    !item.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  {/* Icon Indicator */}
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(item.data.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-semibold ${!item.is_read ? 'text-foreground font-bold' : 'text-foreground/80'}`}>
                        {item.data.title ?? 'System Notification'}
                      </p>
                      {!item.is_read && (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {item.data.message}
                    </p>
                    {item.data.type === 'job_post_rejected' && item.data.rejection_reason && (
                      <div className="mt-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] leading-relaxed flex items-start gap-1.5">
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <div>
                          <span className="font-semibold">Reason: </span>
                          <span>{item.data.rejection_reason}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                      <Clock size={12} />
                      <span>{item.created_at_human ?? new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div
                    className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!item.is_read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(item.id)}
                        className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-background transition-colors"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-background transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-border bg-muted/40 text-center">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/my-job-posts')
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                View my job posts & feedback →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
