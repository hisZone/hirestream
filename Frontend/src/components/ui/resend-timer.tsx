import * as React from "react"
import { useTranslation } from "react-i18next"

interface ResendTimerProps {
  onResend: () => void | Promise<void>
  seconds?: number
  disabled?: boolean
}

export function ResendTimer({ onResend, seconds = 60, disabled }: ResendTimerProps) {
  const { t } = useTranslation()
  const [remaining, setRemaining] = React.useState(seconds)
  const [isResending, setIsResending] = React.useState(false)

  React.useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  const handleResend = async () => {
    setIsResending(true)
    try {
      await onResend()
      setRemaining(seconds)
    } finally {
      setIsResending(false)
    }
  }

  if (remaining > 0) {
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    const display = `${mins}:${secs.toString().padStart(2, "0")}`
    return (
      <p className="text-sm text-muted-foreground text-center">
        {t('otp.resendIn', { time: display })}
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={disabled || isResending}
      className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed w-full text-center"
    >
      {isResending ? t('otp.resending') : t('otp.resendCode')}
    </button>
  )
}
