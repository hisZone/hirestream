import { useEffect, useState, useCallback } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import api from '@/lib/api'
import { getStorageUrl } from '@/lib/utils'
import { usePageRefresh } from '@/hooks/usePageRefresh'

type CompanyUser = {
  id: number
  name: string
  email: string
}

type JobPostItem = {
  id: number
  title: string
  job_type: string
  location: string | null
  status: string
  created_at: string
}

type EmployerCompany = {
  id: number
  company_name: string
  email: string | null
  phone: string | null
  location: string | null
  website: string | null
  industry: string | null
  company_size: string | null
  description: string | null
  logo: string | null
  approval_status: 'approved' | 'pending' | 'rejected'
  job_posts_count?: number
  user?: CompanyUser
  job_posts?: JobPostItem[]
  created_at: string
}

type Stats = {
  total_companies: number
  approved_companies: number
  pending_companies: number
  rejected_companies: number
  total_jobs: number
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<EmployerCompany[]>([])
  const [brokenLogos, setBrokenLogos] = useState<Record<number, boolean>>({})
  const [stats, setStats] = useState<Stats>({
    total_companies: 0,
    approved_companies: 0,
    pending_companies: 0,
    rejected_companies: 0,
    total_jobs: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalCompanies, setTotalCompanies] = useState(0)

  const [selectedCompany, setSelectedCompany] = useState<EmployerCompany | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fetchCompanies = useCallback(async (searchTerm = search, page = currentPage) => {
    try {
      setIsLoading(true)
      const params: Record<string, string | number> = { page }
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (statusFilter !== 'all') params.status = statusFilter

      const res = await api.get('/admin/companies', { params })
      if (res.data.success && res.data.data) {
        const rawCompanies = res.data.data.companies
        if (Array.isArray(rawCompanies)) {
          setCompanies(rawCompanies)
          setCurrentPage(1)
          setLastPage(1)
          setTotalCompanies(rawCompanies.length)
        } else if (rawCompanies && Array.isArray(rawCompanies.data)) {
          setCompanies(rawCompanies.data)
          setCurrentPage(rawCompanies.current_page || page)
          setLastPage(rawCompanies.last_page || 1)
          setTotalCompanies(rawCompanies.total ?? rawCompanies.data.length)
        } else {
          setCompanies([])
        }

        if (res.data.data.stats) {
          setStats(res.data.data.stats)
        }
      }
    } catch {
      setErrorMessage('Failed to load companies list.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, currentPage])

  useEffect(() => {
    fetchCompanies(search, 1)
  }, [search, statusFilter])

  // Wire into global refresh button
  usePageRefresh(() => {
    fetchCompanies(search, currentPage)
  })

  async function openCompanyDetail(companyId: number) {
    try {
      setActionLoadingId(companyId)
      const res = await api.get(`/admin/companies/${companyId}`)
      if (res.data.success && res.data.data) {
        setSelectedCompany(res.data.data)
      }
    } catch {
      setErrorMessage('Failed to load company details.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleStatusUpdate(companyId: number, status: 'approved' | 'rejected') {
    try {
      setActionLoadingId(companyId)
      const res = await api.post(`/admin/companies/${companyId}/${status}`)
      if (res.data.success) {
        setMessage(`Company ${status} successfully.`)
        await fetchCompanies(search, currentPage)
        if (selectedCompany?.id === companyId && res.data.data) {
          setSelectedCompany(res.data.data)
        }
        window.setTimeout(() => setMessage(''), 3500)
      }
    } catch {
      setErrorMessage(`Failed to update company status to ${status}.`)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDeleteCompany() {
    if (!deleteTargetId) return
    try {
      setActionLoadingId(deleteTargetId)
      const res = await api.delete(`/admin/companies/${deleteTargetId}`)
      if (res.data.success) {
        setMessage('Company removed permanently.')
        setDeleteTargetId(null)
        if (selectedCompany?.id === deleteTargetId) {
          setSelectedCompany(null)
        }
        await fetchCompanies(search, currentPage)
        window.setTimeout(() => setMessage(''), 3500)
      }
    } catch {
      setErrorMessage('Failed to delete company profile.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notion Document Header */}
      <div className="border-b border-border/60 pb-5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted text-foreground text-[11px] font-semibold">
            C
          </span>
          <span>Workspace</span>
          <span>/</span>
          <span className="text-foreground">Companies Directory</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Registered Companies
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review company identities, verify business registrations, and manage platform permissions.
            </p>
          </div>
          <button
            onClick={() => fetchCompanies(search, currentPage)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Entities</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.total_companies}</div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Approved</span>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.approved_companies}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pending_companies}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.rejected_companies}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Listings</span>
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{stats.total_jobs}</div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {message}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies by name, location, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/70 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border/70 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Approval Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved & Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-xs">Loading companies...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-sm text-foreground">No companies found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              No organization profiles match your search criteria. Try modifying your filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-medium">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Industry</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Open Jobs</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted font-bold text-xs text-foreground">
                          {c.logo && !brokenLogos[c.id] ? (
                            <img
                              src={getStorageUrl(c.logo)}
                              alt={c.company_name}
                              className="h-full w-full object-cover"
                              onError={() => setBrokenLogos((prev) => ({ ...prev, [c.id]: true }))}
                            />
                          ) : (
                            c.company_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{c.company_name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.company_size || 'Size unspecified'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {c.email ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{c.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">No email</span>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-foreground">{c.industry || 'General'}</td>

                    <td className="px-5 py-3.5">
                      {c.location ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{c.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Remote/Unset</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {c.approval_status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </span>
                      )}
                      {c.approval_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      {c.approval_status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {c.job_posts_count ?? 0} jobs
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openCompanyDetail(c.id)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="View Company Dossier"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {c.approval_status !== 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(c.id, 'approved')}
                            disabled={actionLoadingId === c.id}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                            title="Approve Company"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {c.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(c.id, 'rejected')}
                            disabled={actionLoadingId === c.id}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            title="Reject Company"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteTargetId(c.id)}
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Company Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {lastPage > 1 && (
          <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
              <span className="font-semibold text-foreground">{lastPage}</span>
              {totalCompanies > 0 && (
                <span className="ml-1">({totalCompanies} companies)</span>
              )}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const prevPage = Math.max(currentPage - 1, 1)
                  setCurrentPage(prevPage)
                  fetchCompanies(search, prevPage)
                }}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 border border-border/70 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  const nextPage = Math.min(currentPage + 1, lastPage)
                  setCurrentPage(nextPage)
                  fetchCompanies(search, nextPage)
                }}
                disabled={currentPage === lastPage || isLoading}
                className="p-1.5 border border-border/70 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl bg-card border border-border p-6 shadow-2xl space-y-5 text-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted text-lg font-bold text-foreground">
                  {selectedCompany.logo && !brokenLogos[selectedCompany.id] ? (
                    <img
                      src={getStorageUrl(selectedCompany.logo)}
                      alt={selectedCompany.company_name}
                      className="h-full w-full object-cover"
                      onError={() => setBrokenLogos((prev) => ({ ...prev, [selectedCompany.id]: true }))}
                    />
                  ) : (
                    selectedCompany.company_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedCompany.company_name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCompany.industry || "Industry not set"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Headquarters</span>
                <p className="font-semibold">{selectedCompany.location || 'Not provided'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Company Scale</span>
                <p className="font-semibold">{selectedCompany.company_size || 'Not provided'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Official Contact</span>
                <p className="font-semibold">{selectedCompany.email || 'None'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Official Website</span>
                {selectedCompany.website ? (
                  <a
                    href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    <Globe className="h-3 w-3" />
                    Visit Website
                  </a>
                ) : (
                  <p className="font-semibold">None</p>
                )}
              </div>
            </div>

            {selectedCompany.description && (
              <div className="space-y-1 text-xs border-t border-border/50 pt-3">
                <span className="text-muted-foreground font-medium">Company Dossier / Overview</span>
                <p className="text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                  {selectedCompany.description}
                </p>
              </div>
            )}

            {selectedCompany.user && (
              <div className="text-xs border-t border-border/50 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-foreground">Registered User: {selectedCompany.user.name}</span>
                    <span className="text-muted-foreground block text-[11px]">{selectedCompany.user.email}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Joined: {new Date(selectedCompany.created_at).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              {selectedCompany.approval_status !== 'approved' && (
                <button
                  onClick={() => handleStatusUpdate(selectedCompany.id, 'approved')}
                  disabled={actionLoadingId === selectedCompany.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Approve Company
                </button>
              )}
              {selectedCompany.approval_status !== 'rejected' && (
                <button
                  onClick={() => handleStatusUpdate(selectedCompany.id, 'rejected')}
                  disabled={actionLoadingId === selectedCompany.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Reject Company
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-2xl space-y-4 text-foreground">
            <h3 className="font-bold text-sm">Confirm Entity Deletion</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this organization record and its associated jobs? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={actionLoadingId === deleteTargetId}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
