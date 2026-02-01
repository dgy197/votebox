import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Globe, LogOut, Shield, ArrowLeft } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui'

// Ballot icon
function BallotIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="6" y="8" width="36" height="32" rx="4" className="fill-gold-400/20 stroke-gold-500" strokeWidth="2"/>
      <rect x="12" y="14" width="24" height="4" rx="1" className="fill-gold-500"/>
      <line x1="6" y1="24" x2="42" y2="24" className="stroke-gold-500" strokeWidth="2"/>
      <path d="M18 32L22 36L30 28" className="stroke-gold-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const { isAdmin, isVoter, user, participant, logout, setUser } = useAuthStore()
  
  const isSuperAdmin = user?.role === 'super_admin'
  const isInOrgContext = isSuperAdmin && user?.organization_id
  
  const handleBackToSuper = () => {
    if (!user) return
    setUser({ ...user, organization_id: null })
    navigate('/super')
  }
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'hu' ? 'en' : 'hu'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }
  
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory-100/80 dark:bg-obsidian-950/80 border-b border-obsidian-100 dark:border-obsidian-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <BallotIcon className="w-9 h-9" />
            <span className="font-display text-xl font-semibold text-obsidian-900 dark:text-ivory-100">
              {t('app.name')}
            </span>
          </Link>
          
          {/* User info - center */}
          {(isAdmin || isVoter) && (
            <div className="hidden sm:flex items-center gap-3">
              {/* Super Admin badge and back button */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-ballot-no/10 dark:bg-ballot-no/20 text-ballot-no text-xs font-medium rounded-lg">
                    <Shield className="w-3 h-3" />
                    Super Admin
                  </span>
                  {isInOrgContext && (
                    <button
                      onClick={handleBackToSuper}
                      className="flex items-center gap-1 px-2.5 py-1 bg-obsidian-100 dark:bg-obsidian-800 hover:bg-obsidian-200 dark:hover:bg-obsidian-700 text-obsidian-700 dark:text-obsidian-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Vissza
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-400" />
                <span className="text-sm text-obsidian-600 dark:text-obsidian-400">
                  {isAdmin ? user?.email : participant?.name}
                </span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
            >
              <Globe className="w-4 h-4" />
              <span className="ml-1 text-xs font-medium">
                {i18n.language.toUpperCase()}
              </span>
            </Button>
            
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            
            {/* Logout */}
            {(isAdmin || isVoter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
