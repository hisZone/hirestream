import { useEffect, useRef, useState, useCallback } from 'react'
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
  XCircle,
} from 'lucide-react'

import EmployerSidebar from '@/components/employer/EmployerSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { getStorageUrl } from '@/lib/utils'
import { usePageRefresh } from '@/hooks/usePageRefresh'

type CompanyProfile = {
  companyName: string
  email: string
  phone: string
  location: string
  website: string
  industry: string
  companySize: string
  description: string
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    industry: 'Technology',
    companySize: '51–200 employees',
    description: '',
  })

  const [approvalStatus, setApprovalStatus] = useState<string>('pending')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCompanyProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/employer/profile')

      if (res.data.success && res.data.data) {
        const data = res.data.data
        const loaded: CompanyProfile = {
          companyName: data.company_name || '',
          email: data.email || data.user?.email || '',
          phone: data.phone || '',
          location: data.location || '',
          website: data.website || '',
          industry: data.industry || 'Technology',
          companySize: data.company_size || '51–200 employees',
          description: data.description || '',
        }
        setProfile(loaded)
        setApprovalStatus(data.approval_status || 'pending')

        if (data.logo) {
          setLogoPreview(getStorageUrl(data.logo))
          setImageError(false)
        }
        if (data.rejection_reason) {
          setRejectionReason(data.rejection_reason)
        }
      }
    } catch {
      setSaveError('Failed to load company profile.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanyProfile()
  }, [fetchCompanyProfile])

  // Wire into global refresh button
  usePageRefresh(fetchCompanyProfile)

  function handleChange(field: keyof CompanyProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
    setSaveError(null)
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setImageError(false)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    setLogoFile(null)
    setImageError(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const formData = new FormData()
      formData.append('company_name', profile.companyName)
      formData.append('email', profile.email)
      formData.append('phone', profile.phone)
      formData.append('location', profile.location)
      formData.append('website', profile.website)
      formData.append('industry', profile.industry)
      formData.append('company_size', profile.companySize)
      formData.append('description', profile.description)

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await api.post('/employer/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data.success) {
        setSaveSuccess(true)
        if (res.data.data?.approval_status) {
          setApprovalStatus(res.data.data.approval_status)
        }
        if (res.data.data?.logo) {
          setLogoPreview(getStorageUrl(res.data.data.logo))
          setImageError(false)
          setLogoFile(null)
        }
      }
    } catch {
      setSaveError('Failed to save profile. Please check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isApproved = approvalStatus === 'approved'
  const isPending = approvalStatus === 'pending'
  const isRejected = approvalStatus === 'rejected'

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployerSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title="Company Profile" />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion Document Header */}
          <div className="border-b border-border/60 pb-5 space-y-1.5 max-w-4xl">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
                🏢
              </span>
              <span>Organization Identity / Business Verification</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Company Profile
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage your organization public profile, branding, and platform verification status.
                </p>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto">
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified & Approved
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Verification
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="h-3.5 w-3.5" />
                    Verification Rejected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Notice Banner */}
          {isRejected && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3 text-rose-800 dark:text-rose-300 max-w-4xl">
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold">Company Verification Rejected</p>
                <p className="text-xs text-rose-700/90 dark:text-rose-400/90 mt-0.5">
                  {rejectionReason || 'Your company profile does not meet the minimum verification guidelines. Please update your details and re-submit.'}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
            {/* Branding & Logo */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Company Branding</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Upload your company emblem or logo</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-muted/30 overflow-hidden">
                  {logoPreview && !imageError ? (
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs"
                    >
                      <Camera className="mr-1.5 h-3.5 w-3.5" />
                      Upload Logo
                    </Button>

                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-7 text-xs text-rose-600 hover:bg-rose-500/10"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, or WEBP up to 2MB. Square ratio recommended.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Business Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Basic details about your organization</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs">Company Name *</Label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={profile.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="industry" className="text-xs">Industry</Label>
                  <input
                    id="industry"
                    type="text"
                    value={profile.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Business Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-muted/30 pl-8.5 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      id="phone"
                      type="text"
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-muted/30 pl-8.5 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs">Headquarters Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      id="location"
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-muted/30 pl-8.5 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-xs">Website URL</Label>
                  <input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="description" className="text-xs">About Company</Label>
                <textarea
                  id="description"
                  rows={4}
                  value={profile.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Provide a short description of your company, mission, and work culture..."
                  className="w-full rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Actions & Alerts */}
            {saveSuccess && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Company profile updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving || isLoading}
                size="sm"
                className="rounded-lg h-8 px-4 text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90"
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
