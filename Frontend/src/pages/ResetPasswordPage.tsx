import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { ShieldCheck, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OtpInput } from '@/components/ui/otp-input'
import { ResendTimer } from '@/components/ui/resend-timer'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const emailFromState = (location.state as { email?: string } | null)?.email ?? ''

  const [email, setEmail] = useState(emailFromState)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [otpError, setOtpError] = useState(false)

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post('/reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: () => {
      toast.success(t('passwords.reset', 'Your password has been reset.'))
      navigate('/login')
    },
    onError: (err: unknown) => {
      setOtpError(true)
      if (axios.isAxiosError(err) && err.response?.data) {
        const msg = err.response.data.message ?? 'Failed to reset password'
        setError(msg)
        toast.error(msg)
        return
      }
      setError('Failed to reset password')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => api.post('/forgot-password', { email }),
  })

  const handleResend = async () => {
    await resendMutation.mutateAsync()
    setCode('')
    setOtpError(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError(t('auth.emailRequired'))
      return
    }
    if (code.length !== 6) {
      setError(t('otp.invalidCode'))
      return
    }
    if (password !== passwordConfirmation) {
      setError(t('auth.passwordMatch'))
      return
    }
    resetMutation.mutate()
  }

  return (
    <AuthLayout>
      <Card className="border border-border/70 shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary mb-2 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {t('otp.forgotPasswordTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('otp.forgotPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!emailFromState && (
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
              </div>
            )}

            <div className="space-y-2">
              <Label className="block text-center text-xs font-medium text-muted-foreground">
                {t('otp.codeSentTo', { email })}
              </Label>
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={resetMutation.isPending}
                error={otpError}
              />
              <ResendTimer onResend={handleResend} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                {t('otp.newPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation" className="text-xs font-medium text-foreground">
                {t('otp.confirmNewPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="h-9 text-xs pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-9 text-xs font-medium"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('passwords.reset', 'Reset password')
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
