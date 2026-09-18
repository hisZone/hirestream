import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isAmharic = i18n.language === 'am'

  const toggleLanguage = () => {
    i18n.changeLanguage(isAmharic ? 'en' : 'am')
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage} title="Toggle language" className="gap-1.5 px-2">
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{isAmharic ? 'AM' : 'EN'}</span>
    </Button>
  )
}
