import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, UserCheck, AlertCircle } from 'lucide-react'

interface ProfileSetupPromptBannerProps {
  missingFields?: string[]
  percentage?: number
}

export default function ProfileSetupPromptBanner({
  missingFields = ['headline', 'skills'],
  percentage = 0,
}: ProfileSetupPromptBannerProps) {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Sparkles size={12} />
              <span>Algorithmic Matching</span>
            </span>
            {percentage > 0 && (
              <span className="text-xs text-muted-foreground font-mono">
                {percentage}% profile completed
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Set up your profile to activate personalized job matches
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              When employers post new verified jobs, our background task worker analyzes your skills and target role to deliver algorithmic recommendations directly to your feed and inbox.
            </p>
          </div>

          {missingFields.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <AlertCircle size={12} /> Needs setup:
              </span>
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground/80 border border-border/60 capitalize"
                >
                  {field}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center sm:self-center">
          <button
            type="button"
            onClick={() => navigate('/edit-profile')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-sm"
          >
            <UserCheck size={14} />
            <span>Complete Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
