import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Upload, Download, Trash2, Eye,
  CheckCircle2, AlertCircle, FileCheck, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import EmployeeSidebar from '@/components/employee/EmployeeSidebar'
import EmployerHeader from '@/components/employer/EmployerHeader'
import api from '@/lib/api'

interface CvStatus {
  has_cv: boolean
  file_name?: string
  uploaded_at?: string
  file_size?: number
}

export default function CVResumePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: cvStatus, isLoading } = useQuery<CvStatus>({
    queryKey: ['cv-status'],
    queryFn: async () => {
      const res = await api.get('/users/cv')
      return res.data?.data ?? res.data
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('cv', file)
      const res = await api.post('/users/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv-status'] })
      setUploadState('success')
      setUploadError(null)
      toast.success(t('cv.uploadedSuccess'))
      setTimeout(() => setUploadState('idle'), 3000)
    },
    onError: (err: any) => {
      setUploadState('error')
      const msg =
        err.response?.data?.errors?.cv?.[0] ??
        err.response?.data?.message ??
        t('cv.uploadFailed')
      setUploadError(msg)
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/cv')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv-status'] })
      toast.success(t('cv.deletedSuccess'))
      setUploadState('idle')
      setUploadError(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? t('cv.deleteFailed'))
    },
  })

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'File size exceeds 2MB limit'
    }
    return null
  }

  const handleFile = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadState('error')
      setUploadError(error)
      toast.error(error)
      return
    }
    setUploadState('uploading')
    uploadMutation.mutate(file)
  }

  const handleView = async () => {
    const res = await api.get('/users/cv/download', { responseType: 'blob' })
    window.open(URL.createObjectURL(res.data), '_blank')
  }

  const handleDownload = async () => {
    const res = await api.get('/users/cv/download', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = cvStatus?.file_name ?? 'cv.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title={t('cv.title')} />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Notion Document Header */}
          <div className="border-b border-border/60 pb-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
                📄
              </span>
              <span>Document Repository</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('cv.title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your primary resume in PDF format. This document is automatically attached to new job applications.
            </p>
          </div>

          {isLoading ? (
            <div className="bg-card border border-border/70 rounded-xl p-6 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-16 bg-muted rounded-lg" />
            </div>
          ) : cvStatus?.has_cv ? (
            /* Active CV Document Card */
            <div className="bg-card border border-border/70 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('cv.activeCV')}
                </h2>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Ready for applications</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {cvStatus.file_name ?? 'Candidate-Resume.pdf'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {cvStatus.uploaded_at
                        ? `Uploaded on ${new Date(cvStatus.uploaded_at).toLocaleDateString()}`
                        : 'Uploaded and verified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <button
                    onClick={handleView}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t('cv.view')}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t('cv.download')}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t('cv.confirmDelete'))) {
                        deleteMutation.mutate()
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-200 dark:border-rose-900/40 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{deleteMutation.isPending ? t('cv.deleting') : t('cv.delete')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Upload Dropzone */}
          <div className="bg-card border border-border/70 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cvStatus?.has_cv ? t('cv.replaceCV') : t('cv.uploadCV')}
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground">Max: 2MB (PDF only)</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center space-y-2.5 ${
                dragOver
                  ? 'border-foreground bg-neutral-100 dark:bg-neutral-800/80'
                  : 'border-border/80 hover:border-foreground/40 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                data-testid="cv-input"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />

              <div className="h-10 w-10 rounded-lg bg-muted text-foreground flex items-center justify-center">
                <Upload className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Drag and drop your CV here
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Supported format: PDF (Max 2MB)
                </p>
              </div>

              {uploadState === 'uploading' && (
                <div className="flex items-center gap-2 text-xs font-medium text-foreground pt-2">
                  <div className="h-3.5 w-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  <span>{t('cv.uploading')}</span>
                </div>
              )}
            </div>

            {uploadState === 'success' && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{t('cv.uploadedSuccess')}</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-800 dark:text-rose-300 bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Minimal Tip Footer */}
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground p-3.5 rounded-lg border border-border/60 bg-muted/20">
            <FileCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ensure your CV contains updated contact information, education, and relevant work experiences before applying to open roles.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
