import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Zap,
  Bookmark,
  Sparkles,
  MapPin,
  Building2,
  DollarSign,
  ChevronRight,
  Layers,
  FileText,
  Video,
  ArrowUpRight,
  Menu,
  X,
  Laptop,
  Compass,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/stores/auth'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleTab, setSelectedRoleTab] = useState<'candidate' | 'employer'>('candidate')
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'matching' | 'scheduler' | 'pipeline'>('matching')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Live countdown state for interactive scheduler showcase demo
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 28, seconds: 45 })
  const [mockSaved, setMockSaved] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/job-search?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/job-search')
    }
  }

  const getDashboardPath = () => {
    if (!user) return '/dashboard'
    if (user.role === 'employer') return '/employer-dashboard'
    if (user.role === 'employee') return '/my-applications'
    if (user.role === 'admin') return '/admin'
    return '/dashboard'
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 flex flex-col font-sans antialiased">
      {/* ── 1. Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              H
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">HireStream</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                v2.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Platform Features
            </a>
            <a href="#showcase" className="hover:text-foreground transition-colors">
              Live Showcase
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#categories" className="hover:text-foreground transition-colors">
              Explore Roles
            </a>
            <Link to="/job-search" className="hover:text-foreground transition-colors flex items-center gap-1">
              <span>Jobs Directory</span>
              <ArrowUpRight size={12} className="text-muted-foreground" />
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden lg:inline">
                  Welcome, <strong className="text-foreground">{user?.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(getDashboardPath())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-xs"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg border border-border bg-card text-foreground"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-border bg-background px-4 py-4 space-y-3 animate-in fade-in-50 duration-150">
            <nav className="flex flex-col space-y-2 text-xs font-medium text-muted-foreground">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-foreground"
              >
                Platform Features
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-foreground"
              >
                Live Showcase
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-foreground"
              >
                Explore Roles
              </a>
              <Link
                to="/job-search"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-foreground font-semibold text-foreground flex items-center gap-1"
              >
                <span>Jobs Directory</span>
                <ArrowUpRight size={13} />
              </Link>
            </nav>

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate(getDashboardPath())
                  }}
                  className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  Go to Workspace
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-xs font-medium rounded-lg border border-border bg-card"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/60">
        {/* Subtle Engineering Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-neutral-200/40 dark:bg-neutral-800/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-card/80 backdrop-blur-xs text-[11px] font-medium text-foreground shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">HireStream Engine v2.0</span>
            <span className="text-border">|</span>
            <span className="font-semibold">Algorithmic Precision Matching</span>
            <Sparkles size={12} className="text-amber-500" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            Where Exceptional Talent Meets{' '}
            <span className="underline decoration-border/80 underline-offset-8">
              Verified Opportunities.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Engineered with background algorithmic candidate matching, built-in structured interview countdowns, and strict company verification. No ghost jobs. No recruitment spam.
          </p>

          {/* Quick Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-card border border-border/80 rounded-2xl p-2 sm:p-2.5 shadow-md shadow-black/5 dark:shadow-none flex flex-col sm:flex-row gap-2 transition-all focus-within:border-foreground/40"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title, skills, or role (e.g. Senior Backend Developer)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-transparent rounded-xl focus:outline-none placeholder:text-muted-foreground text-foreground"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <span>Explore Roles</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Clickable Trending Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
            <span className="font-medium text-foreground/70">Popular:</span>
            {[
              'Backend Developer',
              'Senior Full Stack',
              'DevOps Engineer',
              'React Specialist',
              'PostgreSQL',
              'Remote',
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigate(`/job-search?search=${encodeURIComponent(tag)}`)}
                className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium border border-border/60 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/job-search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <Briefcase size={15} />
              <span>Browse All Verified Jobs</span>
            </Link>
            <Link
              to="/register?role=employer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-colors"
            >
              <Building2 size={15} />
              <span>Post a Job as Employer</span>
            </Link>
          </div>

          {/* Trust Metrics Strip */}
          <div className="pt-8 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            {[
              { label: 'Algorithmic Precision', value: '98%', detail: 'Seniority & role normalized' },
              { label: 'Admin Turnaround', value: '< 2 hrs', detail: 'Every job & company vetted' },
              { label: 'Verified Pipeline', value: '100%', detail: 'Zero ghost or scraping posts' },
              { label: 'Interview Suite', value: 'Built-in', detail: 'Live sync & countdown clocks' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-2xs"
              >
                <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-mono">
                  {metric.value}
                </div>
                <div className="text-xs font-semibold text-foreground/90">{metric.label}</div>
                <div className="text-[11px] text-muted-foreground">{metric.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Interactive Platform Showcase (Proof over decoration) ── */}
      <section id="showcase" className="py-16 sm:py-20 border-b border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground border border-border/60">
              <Laptop size={12} />
              <span>LIVE WORKSPACE SIMULATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              A Unified Engine for Candidates and Hiring Teams
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explore the core surfaces of HireStream. Real data shapes, structured workflows, and zero fluff.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-card border border-border/80 shadow-xs gap-1">
              <button
                type="button"
                onClick={() => setActiveShowcaseTab('matching')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeShowcaseTab === 'matching'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Cpu size={14} />
                <span>Algorithmic Matching</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShowcaseTab('scheduler')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeShowcaseTab === 'scheduler'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar size={14} />
                <span>Interview Scheduler</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShowcaseTab('pipeline')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeShowcaseTab === 'pipeline'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers size={14} />
                <span>Applicant Pipeline</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-8 shadow-lg shadow-black/5 dark:shadow-none max-w-4xl mx-auto">
            {/* Window Chrome / Browser Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="px-3 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground border border-border/40">
                https://hirestream.platform/workspace/{activeShowcaseTab}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono hidden sm:inline-block">
                ● Live Engine
              </div>
            </div>

            {/* TAB 1: Algorithmic Match Feed Preview */}
            {activeShowcaseTab === 'matching' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Candidate Algorithmic Feed
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Target profile: <strong className="text-foreground">Senior Backend Developer</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    High Compatibility (94%)
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                      94% MATCH
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border/80">
                      <CheckCircle2 size={11} />
                      Role Match (Senior)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                      Remote
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                      Full-time
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-foreground hover:underline cursor-pointer">
                        Backend Developer
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-foreground/90">
                          <Building2 size={13} /> Stripe Ecosystem
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> San Francisco, CA / Remote
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <DollarSign size={13} /> 140,000 - 175,000 USD
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMockSaved((v) => !v)}
                        className={`p-2 rounded-lg border transition-colors ${
                          mockSaved
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                            : 'bg-card text-muted-foreground hover:text-foreground border-border'
                        }`}
                        title={mockSaved ? 'Saved' : 'Save job'}
                      >
                        <Bookmark size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/job-search')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>

                  {/* Matched skills tags */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Matched Competencies:
                    </span>
                    {['Backend Development', 'PHP', 'Laravel', 'PostgreSQL', 'Docker', 'API Architecture'].map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border/60"
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Interview Scheduler Preview */}
            {activeShowcaseTab === 'scheduler' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Structured Interview Suite
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Direct countdown & calendar integration for candidate and employer
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    Live Status: Confirmed
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5 space-y-4">
                  {/* Countdown Bar */}
                  <div className="rounded-lg bg-muted/60 p-3 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-foreground" />
                      <span className="text-xs font-semibold text-foreground">Interview Commences In:</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                      <span className="px-2 py-1 rounded bg-card border border-border">
                        {String(countdown.days).padStart(2, '0')}d
                      </span>
                      :
                      <span className="px-2 py-1 rounded bg-card border border-border">
                        {String(countdown.hours).padStart(2, '0')}h
                      </span>
                      :
                      <span className="px-2 py-1 rounded bg-card border border-border">
                        {String(countdown.minutes).padStart(2, '0')}m
                      </span>
                      :
                      <span className="px-2 py-1 rounded bg-card border border-border text-emerald-600 dark:text-emerald-400">
                        {String(countdown.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-foreground">
                      Technical Architecture & Systems Discussion
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground/90">
                        <Building2 size={13} /> Acme Cloud Systems
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> Friday, 10:30 AM UTC
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Video size={13} /> Google Meet Video Room
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Discussion of scalable backend distributed queues, PostgreSQL indexing, and API lifecycle with the Engineering Lead.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                    >
                      <Video size={13} />
                      <span>Join Video Call</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground"
                    >
                      <Calendar size={13} />
                      <span>Add to Google Calendar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Employer Review Pipeline Preview */}
            {activeShowcaseTab === 'pipeline' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Employer Hiring Pipeline
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Review, shortlist, and transition applicants with zero friction
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">
                    Role: Backend Developer (18 Applicants)
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 overflow-hidden divide-y divide-border/60">
                  {[
                    {
                      name: 'Alex Mercer',
                      headline: 'Senior Backend Developer (9 yrs exp)',
                      status: 'Interview Scheduled',
                      score: '96%',
                      statusClass: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                    },
                    {
                      name: 'Sarah Chen',
                      headline: 'Staff Infrastructure & Cloud Engineer',
                      status: 'Shortlisted',
                      score: '91%',
                      statusClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
                    },
                    {
                      name: 'David Kim',
                      headline: 'Full Stack Engineer (PHP / React)',
                      status: 'Under Review',
                      score: '84%',
                      statusClass: 'bg-muted text-muted-foreground border border-border/60',
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="p-3.5 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{row.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                            {row.score} Match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{row.headline}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${row.statusClass}`}>
                          {row.status}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded text-xs font-medium border border-border hover:bg-muted text-foreground flex items-center gap-1"
                        >
                          <FileText size={12} />
                          <span>CV</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Key Platform Pillars (Engineering Grid) ── */}
      <section id="features" className="py-16 sm:py-24 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground border border-border/60">
              <Zap size={12} />
              <span>CRAFTED ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Engineered for Speed, Clarity, and Precision
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
              Every feature on HireStream was purposefully designed to eliminate hiring friction, recruitment noise, and disconnected tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Cpu,
                title: 'Seniority & Synonym Normalization',
                description:
                  'Whether an employer posts "Backend Developer" and a candidate is "Senior Backend Developer" or "Server-Side Engineer", our algorithm canonicalizes core roles for 100% equivalence.',
                badge: 'Core Algorithm',
              },
              {
                icon: Calendar,
                title: 'Integrated Interview Scheduler',
                description:
                  'Book technical interviews directly from the shortlist. Features live countdown timers, calendar reminders, and synchronized status updates so nobody misses a session.',
                badge: 'Interactive Tooling',
              },
              {
                icon: ShieldCheck,
                title: '100% Admin-Verified Postings',
                description:
                  'Every job post and company profile is vetted and approved by administrators before going live. Zero spam, zero fake recruitment scams, and zero ghost jobs.',
                badge: 'Quality Guarantee',
              },
              {
                icon: Zap,
                title: 'Background Queue Dispatch Workers',
                description:
                  'Instant matching. The moment an admin approves a job, background workers analyze candidate profiles and push high-score matches directly to their feeds in real time.',
                badge: 'Laravel Queue Worker',
              },
              {
                icon: FileText,
                title: 'Unified CV & Resume Storage',
                description:
                  'Upload, replace, and manage PDF resumes with 1-click downloads. Employers can review candidate qualifications immediately without jumping through external file services.',
                badge: 'Direct Workspace',
              },
              {
                icon: Compass,
                title: 'Saved Jobs & Status Tracking',
                description:
                  'Bookmark high-match opportunities, manage applications, and track progress from submitted to shortlisted, scheduled, and hired with real-time status clarity.',
                badge: 'Candidate Flow',
              },
            ].map((pillar) => {
              const Icon = pillar.icon
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 space-y-3 transition-all hover:border-foreground/30 hover:shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-2xs">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 5. How HireStream Works (Dual Track) ── */}
      <section id="how-it-works" className="py-16 sm:py-20 border-b border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              How HireStream Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A frictionless workflow tailored for both job seekers and hiring teams.
            </p>

            {/* Persona Switcher Buttons */}
            <div className="pt-2 flex justify-center">
              <div className="inline-flex p-1 rounded-xl bg-card border border-border shadow-xs gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('candidate')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRoleTab === 'candidate'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  For Candidates
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('employer')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRoleTab === 'employer'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  For Employers
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          {selectedRoleTab === 'candidate' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: '01',
                  title: 'Setup Your Profile & Upload CV',
                  desc: 'Add your headline (e.g. Senior Backend Developer), key competencies, and upload your PDF resume in your workspace.',
                },
                {
                  step: '02',
                  title: 'Receive Algorithmic Matches',
                  desc: 'As soon as verified jobs are approved, our background matching engine feeds high-affinity roles directly to your dashboard.',
                },
                {
                  step: '03',
                  title: 'Attend Scheduled Interviews',
                  desc: 'Track application stages and join interviews with countdown timers, direct call links, and calendar synchronization.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 relative shadow-2xs"
                >
                  <div className="font-mono text-2xl font-black text-foreground/80">{s.step}</div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: '01',
                  title: 'Post Your Role Requirements',
                  desc: 'Submit job details, required technical skills, salary range, and remote preferences through our structured job creator.',
                },
                {
                  step: '02',
                  title: 'Instant Admin Verification',
                  desc: 'Our team reviews your posting to maintain high platform quality. Once approved, matches are dispatched automatically.',
                },
                {
                  step: '03',
                  title: 'Review & Schedule Interviews',
                  desc: 'Filter matched applicants, view candidate CVs, update hiring stages, and book interview slots with integrated countdowns.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 relative shadow-2xs"
                >
                  <div className="font-mono text-2xl font-black text-foreground/80">{s.step}</div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Explore Popular Categories Grid ── */}
      <section id="categories" className="py-16 sm:py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground border border-border/60 mb-2">
                <Compass size={12} />
                <span>DIRECTORY BROWSER</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Browse Roles by Engineering Domain
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore curated positions across modern engineering and technical disciplines.
              </p>
            </div>

            <Link
              to="/job-search"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
            >
              <span>View all available roles</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Backend Engineering',
                keyword: 'backend',
                count: 'PHP, Laravel, Node.js, Go, Python',
                icon: Cpu,
              },
              {
                title: 'Frontend & UI Engineering',
                keyword: 'frontend',
                count: 'React, TypeScript, Next.js, Tailwind',
                icon: Laptop,
              },
              {
                title: 'DevOps & Cloud Infrastructure',
                keyword: 'devops',
                count: 'Docker, Kubernetes, AWS, Terraform',
                icon: Layers,
              },
              {
                title: 'Full Stack Development',
                keyword: 'fullstack',
                count: 'End-to-end architecture & APIs',
                icon: Zap,
              },
              {
                title: 'Mobile App Engineering',
                keyword: 'mobile',
                count: 'React Native, Flutter, iOS, Android',
                icon: Compass,
              },
              {
                title: 'Product & System Design',
                keyword: 'design',
                count: 'Design systems, UI/UX, Component craft',
                icon: Sparkles,
              },
            ].map((cat) => {
              const Icon = cat.icon
              return (
                <div
                  key={cat.title}
                  onClick={() => navigate(`/job-search?search=${encodeURIComponent(cat.keyword)}`)}
                  className="group rounded-2xl border border-border/70 bg-card p-5 hover:border-foreground/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:underline">
                        {cat.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cat.count}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 7. Call To Action Banner ── */}
      <section className="py-16 sm:py-24 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-neutral-900/10 dark:border-neutral-800 bg-neutral-950 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative space-y-3 max-w-xl mx-auto">
              <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white/10 text-white/90 border border-white/10">
                START IN SECONDS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Ready to Experience Precision Hiring?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Whether you are looking for your next engineering role or hiring top-tier talent, HireStream connects you through algorithmic clarity.
              </p>
            </div>

            <div className="relative flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
              >
                <span>Create Free Candidate Account</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/register?role=employer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-colors"
              >
                <span>Register as Employer</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Platform Footer ── */}
      <footer className="py-12 bg-background border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs">
                  H
                </div>
                <span className="font-bold text-base tracking-tight text-foreground">HireStream</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm">
                Next-generation talent matching engine with algorithmic precision, verified employers, and structured interview scheduling.
              </p>
            </div>

            {/* Platform Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-card text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-muted-foreground text-[11px]">System Status:</span>
              <span className="font-semibold text-foreground text-[11px]">All Systems Operational</span>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              &copy; {new Date().getFullYear()} HireStream Platform. All rights reserved.
            </div>

            <div className="flex items-center gap-4">
              <Link to="/job-search" className="hover:text-foreground transition-colors">
                Browse Jobs
              </Link>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="hover:text-foreground transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
