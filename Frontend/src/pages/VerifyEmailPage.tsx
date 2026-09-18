import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MailCheck, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtpInput } from '@/components/ui/otp-input'
import { ResendTimer } from '@/components/ui/resend-timer'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, getProfile, logout } = useAuthStore()

  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const verifyMutation = useMutation({
    mutationFn: (submittedCode: string) => api.post('/email/verify-otp', { code: submittedCode }),
    onSuccess: async () => {
      toast.success(t('auth.emailVerified', 'Email verified successfully'))
      await getProfile()
      if (user?.role === 'employer') {
        navigate('/employer-dashboard')
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      setError(true)
      toast.error(t('otp.invalidCode'))
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => api.post('/email/resend'),
  })

  const handleComplete = (submittedCode: string) => {
    verifyMutation.mutate(submittedCode)
  }

  const handleResend = async () => {
    await resendMutation.mutateAsync()
    setCode('')
    setError(false)
  }

  return (
    <AuthLayout>
      <Card className="border border-border/70 shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary mb-2 shadow-2xs">
            <MailCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {t('otp.registerTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('otp.codeSentTo', { email: user?.email ?? '' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={handleComplete}
              disabled={verifyMutation.isPending}
              error={error}
            />
            <ResendTimer onResend={handleResend} />
          </div>

          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 w-full text-center transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('auth.logout')}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
