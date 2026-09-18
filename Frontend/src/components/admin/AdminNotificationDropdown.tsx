import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Check,
  CheckCheck,
  BriefcaseBusiness,
  Building2,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminNotificationService } from '@/services/adminNotificationService'
import type { AdminNotification } from '@/types'

export default function AdminNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Poll unread count every 30 seconds as background fallback
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: () => adminNotificationService.getUnreadCount(),
    refetchInterval: 30000,
  })

  // Fetch notifications list
  const {
    data: notificationsData,
    isLoading,
  } = useQuery({
    queryKey: ['admin-notifications', filterUnread],
    queryFn: () => adminNotificationService.getNotifications({ unread: filterUnread || undefined, per_page: 15 }),
    refetchInterval: isOpen ? 15000 : 30000,
  })

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => adminNotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Failed to mark notification as read')
    },
  })

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => adminNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['admin-notifications-unread-count'], 0)
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminNotificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] })
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

  const handleNotificationClick = (notification: AdminNotification) => {
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
      case 'job_submitted_for_review':
        return <BriefcaseBusiness size={16} className="text-blue-600 dark:text-blue-400" />
      case 'employer_pending_approval':
        return <Building2 size={16} className="text-amber-600 dark:text-amber-400" />
      default:
        return <Bell size={16} className="text-muted-foreground" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus:outline-none"
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Admin Notifications'}
        aria-label="Admin Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full border-2 border-background shadow-xs animate-pulse"
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-blue-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-border/60 px-3 py-1.5 bg-popover text-xs gap-1.5">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                !filterUnread ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                filterUnread ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Unread only
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-medium text-foreground">No notifications</p>
                <p className="text-[11px] text-muted-foreground">
                  {filterUnread ? 'No unread notifications right now' : 'You are all caught up!'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex gap-3 transition-colors hover:bg-muted/40 cursor-pointer relative group ${
                    !item.is_read ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  {/* Icon Indicator */}
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(item.data.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-semibold ${!item.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {item.data.title ?? 'System Notification'}
                      </p>
                      {!item.is_read && (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {item.data.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/80">
                      <Clock size={11} />
                      <span>{item.created_at_human ?? new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div
                    className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!item.is_read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(item.id)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-border/60 bg-muted/20 text-center">
              <span className="text-[10px] text-muted-foreground">
                Showing {notifications.length} recent notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
