import { useEffect } from 'react'

/**
 * Custom hook that listens for the 'app:refresh' event triggered by the RefreshButton
 * so pages and components can re-fetch or synchronize their live data.
 */
export function usePageRefresh(callback: () => void | Promise<void>) {
  useEffect(() => {
    const handleRefresh = () => {
      try {
        callback()
      } catch (err) {
        console.error('Error executing refresh callback:', err)
      }
    }

    window.addEventListener('app:refresh', handleRefresh)
    return () => {
      window.removeEventListener('app:refresh', handleRefresh)
    }
  }, [callback])
}

export default usePageRefresh
