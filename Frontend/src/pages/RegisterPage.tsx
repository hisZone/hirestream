import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  UserPlus,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  MailCheck,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OtpInput } from '@/components/ui/otp-input'
import { ResendTimer } from '@/components/ui/resend-timer'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import axios from 'axios'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register: registerUser, getProfile, isLoading } = useAuthStore()

  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [registeredRole, setRegisteredRole] = useState<'employee' | 'employer'>('employee')
  const [code, setCode] = useState('')
  const [otpError, setOtpError] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const registerSchema = z
    .object({
      name: z.string().min(1, t('auth.nameRequired')),
      email: z.string().email('Invalid email address'),
      username: z.string().min(3, 'Username must be at least 3 characters'),
      role: z.enum(['employee', 'employer'], {
        message: 'Please select an account type',
      }),
      password: z.string().min(8, t('auth.passwordMin')),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t('auth.passwordMatch'),
      path: ['password_confirmation'],
    })

  type RegisterForm = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'employee',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data)
      setRegisteredEmail(data.email)
      setRegisteredRole(data.role)
      setStep('verify')
      toast.success(t('auth.registerSuccess', 'Account created! Please check your email for the verification code.'))
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const serverData = error.response.data
        if (serverData.errors && typeof serverData.errors === 'object') {
          let firstErrorMessage = ''
          Object.entries(serverData.errors).forEach(([field, messages]) => {
            const msgList = messages as string[]
            if (msgList && msgList[0]) {
              if (!firstErrorMessage) firstErrorMessage = msgList[0]
              if (
                ['name', 'email', 'username', 'role', 'password', 'password_confirmation'].includes(field)
              ) {
                setError(field as keyof RegisterForm, { message: msgList[0] })
              }
            }
          })
          toast.error(firstErrorMessage || serverData.message || 'Validation failed')
          return
        }
        if (serverData.message) {
          toast.error(serverData.message)
          return
        }
      }
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast.error(message)
    }
  }

  // OTP Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: (submittedCode: string) => api.post('/email/verify-otp', { code: submittedCode }),
    onSuccess: async () => {
      toast.success(t('auth.emailVerified', 'Email verified successfully!'))
      const updatedUser = await getProfile()
      if (updatedUser?.role === 'employer' || registeredRole === 'employer') {
        navigate('/employer-dashboard')
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      setOtpError(true)
      toast.error(t('otp.invalidCode', 'Invalid or expired code. Please try again.'))
    },
  })

  // OTP Resend Mutation
  const resendMutation = useMutation({
    mutationFn: () => api.post('/email/resend'),
    onSuccess: () => {
      toast.success('A new verification code has been sent to your email.')
    },
    onError: () => {
      toast.error('Failed to resend code. Please wait before trying again.')
    },
  })

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    if (otpError) setOtpError(false)
  }

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length === 6 && !verifyMutation.isPending) {
      verifyMutation.mutate(code)
    }
  }

  const handleResend = async () => {
    await resendMutation.mutateAsync()
    setCode('')
    setOtpError(false)
  }

  // Render Step 2: OTP Verification Card
  if (step === 'verify') {
    return (
      <AuthLayout>
        <Card className="border border-border/70 shadow-lg shadow-black/5 dark:shadow-none">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary mb-2 shadow-2xs">
              <MailCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {t('otp.registerTitle', 'Verify your email')}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('otp.codeSentTo', { email: registeredEmail || 'your email' })}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-3">
                <OtpInput
                  value={code}
                  onChange={handleCodeChange}
                  onComplete={(val) => {
                    if (!verifyMutation.isPending) {
                      verifyMutation.mutate(val)
                    }
                  }}
                  autoSubmit={false}
                  disabled={verifyMutation.isPending}
                  error={otpError}
                />
                <ResendTimer onResend={handleResend} />
              </div>

              <Button
                type="submit"
                disabled={code.length !== 6 || verifyMutation.isPending}
                className="w-full gap-2 cursor-pointer font-medium"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('otp.verifying', 'Verifying...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('otp.verify', 'Verify & Continue')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setStep('register')
                  setCode('')
                  setOtpError(false)
                }}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Wrong email? Re-enter</span>
              </button>

              <Link to="/login" className="hover:text-foreground transition-colors">
                {t('auth.login', 'Log In')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  // Render Step 1: Initial Registration Form
  return (
    <AuthLayout>
      <Card className="border border-border/70 shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary mb-2 shadow-2xs">
            <UserPlus className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {t('auth.registerTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('auth.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3.5">
            {/* Account Type / Role Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t('auth.accountType', 'I am registering as')}
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValue('role', 'employee')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    selectedRole === 'employee'
                      ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                      : 'border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Briefcase className={`h-3.5 w-3.5 flex-shrink-0 ${selectedRole === 'employee' ? 'text-sidebar-primary' : 'text-muted-foreground'}`} />
                  <span>Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'employer')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    selectedRole === 'employer'
                      ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                      : 'border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Building2 className={`h-3.5 w-3.5 flex-shrink-0 ${selectedRole === 'employer' ? 'text-sidebar-primary' : 'text-muted-foreground'}`} />
                  <span>Employer</span>
                </button>
              </div>
              {errors.role && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.role.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-foreground">
                {t('auth.nameRequired').replace(' is required', '')}
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="h-9 text-xs"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="h-9 text-xs"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">
                {t('auth.username')}
              </Label>
              <Input
                id="username"
                placeholder="johndoe"
                className="h-9 text-xs"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.username.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-9 text-xs pr-10"
                  {...register('password')}
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
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation" className="text-xs font-medium text-foreground">
                {t('auth.confirmPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-9 text-xs pr-10"
                  {...register('password_confirmation')}
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
              {errors.password_confirmation && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{errors.password_confirmation.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full h-9 text-xs font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.registerButton')
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary font-medium underline-offset-4 hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
