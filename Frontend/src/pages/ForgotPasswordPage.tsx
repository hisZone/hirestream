import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { KeyRound, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const requestMutation = useMutation({
    mutationFn: () => api.post('/forgot-password', { email }),
    onSuccess: () => {
      toast.success(t('otp.codeSentTo', { email }))
      navigate('/reset-password', { state: { email } })
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data) {
        const msg =
          err.response.data.errors?.email?.[0] ??
          err.response.data.message ??
          'Failed to send code'
        setError(msg)
        toast.error(msg)
        return
      }
      setError('Failed to send code')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    requestMutation.mutate()
  }

  return (
    <AuthLayout>
      <Card className="border border-border/70 shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary mb-2 shadow-2xs">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {t('auth.forgotPassword', 'Forgot password?')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('auth.forgotPasswordDesc', "Enter your email and we'll send you a verification code.")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
                required
              />
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-9 text-xs font-medium"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('otp.resendCode', 'Send code')
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-primary font-medium underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t('auth.backToLogin', 'Back to login')}</span>
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
