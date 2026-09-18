import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { WorkExperience, Education, Language } from '@/stores/profile'
import EmployeeSidebar from '@/components/employee/EmployeeSidebar'
import { employeeFeedService } from '@/services/employeeFeedService'
import { useEffect } from 'react'
import EmployerHeader from '@/components/employer/EmployerHeader'

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile, setProfile } = useProfileStore()

  const [headline, setHeadline] = useState(profile.headline)
  const [phone, setPhone] = useState(profile.phone)
  const [location, setLocation] = useState(profile.location)
  const [bio, setBio] = useState(profile.bio)
  const [skills, setSkills] = useState<string[]>(profile.skills)
  const [newSkill, setNewSkill] = useState('')
  const [showSkillInput, setShowSkillInput] = useState(false)
  const [experience, setExperience] = useState<WorkExperience[]>(profile.experience)
  const [education, setEducation] = useState<Education[]>(profile.education)
  const [languages, setLanguages] = useState<Language[]>(profile.languages)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    employeeFeedService.getProfile().then((res) => {
      if (res?.profile) {
        const p = res.profile
        if (p.headline) setHeadline(p.headline)
        if (p.phone) setPhone(p.phone)
        if (p.location) setLocation(p.location)
        if (p.bio) setBio(p.bio)
        if (Array.isArray(p.skills) && p.skills.length > 0) setSkills(p.skills)
        if (Array.isArray(p.experience) && p.experience.length > 0) {
          setExperience(p.experience.map((e) => ({
            id: uid(),
            title: e.title || '',
            company: e.company || '',
            period: e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '',
          })))
        }
        if (Array.isArray(p.education) && p.education.length > 0) {
          setEducation(p.education.map((e) => ({
            id: uid(),
            degree: e.degree || '',
            institution: e.institution || '',
            year: e.year || '',
          })))
        }
        if (Array.isArray(p.languages) && p.languages.length > 0) {
          setLanguages(p.languages.map((l) => ({
            id: uid(),
            name: typeof l === 'string' ? l : (l as any).name || '',
            level: (l as any).level || 'Conversational',
          })))
        }
      }
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      setProfile({ headline, phone, location, bio, skills, experience, education, languages })
      await employeeFeedService.updateProfile({
        headline,
        phone,
        location,
        bio,
        skills,
        experience,
        education,
        languages,
      })
      toast.success(t('editProfile.profileSaved'))
      navigate('/my-profile')
    } catch {
      toast.error('Failed to sync profile with recommendation worker')
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setNewSkill('')
    setShowSkillInput(false)
  }

  const addExperience = () =>
    setExperience([...experience, { id: uid(), title: '', company: '', period: '' }])
  const updateExp = (id: string, field: keyof WorkExperience, value: string) =>
    setExperience(experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  const removeExp = (id: string) => setExperience(experience.filter((e) => e.id !== id))

  const addEducation = () =>
    setEducation([...education, { id: uid(), degree: '', institution: '', year: '' }])
  const updateEdu = (id: string, field: keyof Education, value: string) =>
    setEducation(education.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  const removeEdu = (id: string) => setEducation(education.filter((e) => e.id !== id))

  const addLanguage = () =>
    setLanguages([...languages, { id: uid(), name: '', level: 'Conversational' }])
  const updateLang = (id: string, field: keyof Language, value: string) =>
    setLanguages(languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  const removeLang = (id: string) => setLanguages(languages.filter((l) => l.id !== id))

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all placeholder:text-muted-foreground/60'
  const sectionCls = 'bg-card border border-border/70 rounded-xl p-5 sm:p-6 shadow-xs space-y-4'

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <EmployerHeader title={t('editProfile.title')} />

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Document intro note */}
          <div className="border-b border-border/60 pb-5 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Candidate Profile Editor
            </p>
            <p className="text-sm text-muted-foreground">
              Update your professional profile details, background experiences, and verified skills.
            </p>
          </div>

          {/* Personal Information */}
          <section className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.personalInfo')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {t('editProfile.fullName')}
                </label>
                <input
                  value={user?.name ?? ''}
                  disabled
                  className={`${inputCls} bg-muted/40 text-muted-foreground cursor-not-allowed border-dashed`}
                />
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  {t('editProfile.nameManaged')}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  value={user?.email ?? ''}
                  disabled
                  className={`${inputCls} bg-muted/40 text-muted-foreground cursor-not-allowed border-dashed`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {t('editProfile.professionalHeadline')}
                </label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={t('editProfile.headlinePlaceholder')}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {t('editProfile.phone')}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('editProfile.phonePlaceholder')}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {t('editProfile.location')}
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('editProfile.locationPlaceholder')}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* About / Bio */}
          <section className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.aboutBio')}
              </h2>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={t('editProfile.bioPlaceholder')}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </section>

          {/* Skills */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.skills')}
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {skills.length} skills
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 rounded-md"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="text-muted-foreground hover:text-rose-600 transition-colors"
                    aria-label={`Remove skill ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {showSkillInput ? (
                <input
                  autoFocus
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                    if (e.key === 'Escape') {
                      setNewSkill('')
                      setShowSkillInput(false)
                    }
                  }}
                  onBlur={addSkill}
                  placeholder={t('editProfile.skillPlaceholder')}
                  className="w-36 px-2.5 py-1 text-xs rounded-md border border-foreground/30 bg-background focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSkillInput(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-dashed border-border hover:border-foreground/40 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  <span>{t('editProfile.addSkill')}</span>
                </button>
              )}
            </div>
          </section>

          {/* Work Experience */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.workExperience')}
              </h2>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('common.add')}</span>
              </button>
            </div>

            {experience.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">
                {t('editProfile.noExperience')}
              </p>
            )}

            <div className="space-y-3">
              {experience.map((exp) => (
                <div
                  key={exp.id}
                  className="border border-border/70 rounded-lg p-4 space-y-3 relative bg-background/50 hover:border-border transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => removeExp(exp.id)}
                    className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-rose-600 transition-colors p-1"
                    title="Remove experience"
                    aria-label="Remove experience"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.jobTitle')}
                      </label>
                      <input
                        value={exp.title}
                        onChange={(e) => updateExp(exp.id, 'title', e.target.value)}
                        placeholder={t('editProfile.jobTitlePlaceholder')}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.company')}
                      </label>
                      <input
                        value={exp.company}
                        onChange={(e) => updateExp(exp.id, 'company', e.target.value)}
                        placeholder={t('editProfile.companyPlaceholder')}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.period')}
                      </label>
                      <input
                        value={exp.period}
                        onChange={(e) => updateExp(exp.id, 'period', e.target.value)}
                        placeholder={t('editProfile.periodPlaceholder')}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.education')}
              </h2>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('common.add')}</span>
              </button>
            </div>

            {education.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">
                {t('editProfile.noEducation')}
              </p>
            )}

            <div className="space-y-3">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className="border border-border/70 rounded-lg p-4 space-y-3 relative bg-background/50 hover:border-border transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => removeEdu(edu.id)}
                    className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-rose-600 transition-colors p-1"
                    title="Remove education"
                    aria-label="Remove education"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.degreeCertificate')}
                      </label>
                      <input
                        value={edu.degree}
                        onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)}
                        placeholder={t('editProfile.degreePlaceholder')}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.institution')}
                      </label>
                      <input
                        value={edu.institution}
                        onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)}
                        placeholder={t('editProfile.institutionPlaceholder')}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t('editProfile.year')}
                      </label>
                      <input
                        value={edu.year}
                        onChange={(e) => updateEdu(edu.id, 'year', e.target.value)}
                        placeholder={t('editProfile.yearPlaceholder')}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Languages */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {t('editProfile.languages')}
              </h2>
              <button
                type="button"
                onClick={addLanguage}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('common.add')}</span>
              </button>
            </div>

            {languages.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">
                {t('editProfile.noLanguages')}
              </p>
            )}

            <div className="space-y-2">
              {languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-2.5">
                  <input
                    value={lang.name}
                    onChange={(e) => updateLang(lang.id, 'name', e.target.value)}
                    placeholder={t('editProfile.languagePlaceholder')}
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => updateLang(lang.id, 'level', e.target.value)}
                    className={`${inputCls} w-36`}
                  >
                    {[
                      'Native',
                      'Fluent',
                      'Advanced',
                      'Intermediate',
                      'Conversational',
                      'Basic',
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLang(lang.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors flex-shrink-0"
                    aria-label="Remove language"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Primary Actions Bottom */}
          <div className="flex items-center justify-end gap-3 pt-3 pb-8 border-t border-border/50">
            <button
              type="button"
              onClick={() => navigate('/my-profile')}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted/70 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              <span>{isSaving ? 'Saving...' : t('common.saveChanges')}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
