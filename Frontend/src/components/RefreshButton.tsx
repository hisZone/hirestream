import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface RefreshButtonProps {
  className?: string
  showLabel?: boolean
}

export function RefreshButton({ className = '', showLabel = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)

    try {
      // 1. Refetch all active queries in TanStack React Query
      await queryClient.invalidateQueries()

      // 2. Broadcast app:refresh event for pages using custom fetch loops or useEffect
      window.dispatchEvent(new CustomEvent('app:refresh'))

      toast.success('Page data refreshed')
    } catch (err) {
      console.error('Failed to refresh page data:', err)
      toast.error('Failed to refresh data')
    } finally {
      // Maintain smooth spinning animation feedback for at least 500ms
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh page data"
      aria-label="Refresh page data"
      className={`px-2 text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <RotateCw className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-foreground' : ''}`} />
      {showLabel && <span className="ml-1.5 text-xs font-medium">Refresh</span>}
    </Button>
  )
}

export default RefreshButton
