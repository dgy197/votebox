import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Shield, Zap, Moon, Sun, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { Button, Card, Input } from '../../components/ui'

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

export function AdminLogin() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  
  const isDark = theme === 'dark'
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')
  const toggleLang = () => {
    const newLang = i18n.language === 'hu' ? 'en' : 'hu'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        setUser(profile)
        navigate('/admin')
      } else {
        throw new Error('User profile not found')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-obsidian-950 flex flex-col">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold-400/10 via-gold-400/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-radial from-obsidian-400/10 via-obsidian-400/5 to-transparent blur-3xl dark:from-gold-500/5" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BallotIcon className="w-8 h-8" />
            <span className="font-display text-xl font-semibold text-obsidian-900 dark:text-ivory-100">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggleLang}>
              <Globe className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-up" style={{ animationFillMode: 'forwards' }}>
          <Card className="overflow-hidden" padding="none">
            {/* Gold accent line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gold-600 dark:text-gold-400" />
              </div>
              
              <h1 className="font-display text-display-sm text-obsidian-900 dark:text-ivory-100 mb-2 text-center">
                {t('auth.adminLogin')}
              </h1>
              <p className="text-obsidian-500 dark:text-obsidian-400 text-center mb-8">
                Bejelentkezés a kezelőfelületre
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-ballot-no/10 border border-ballot-no/20 text-ballot-no rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-obsidian-700 dark:text-obsidian-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-obsidian-700 dark:text-obsidian-300 mb-2">
                    {t('auth.password')}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            </div>
            
            {/* Demo section */}
            <div className="border-t border-obsidian-100 dark:border-obsidian-800 bg-obsidian-50/50 dark:bg-obsidian-900/50 p-6">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Zap className="w-4 h-4 text-gold-500" />
                <span className="text-sm font-medium text-obsidian-600 dark:text-obsidian-400">Demo mód</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setUser({
                      id: '00000000-0000-0000-0000-000000000099',
                      email: 'super@demo.hu',
                      role: 'super_admin',
                      organization_id: null,
                      created_at: new Date().toISOString()
                    })
                    navigate('/super')
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-ballot-no/10 to-ballot-no/5 hover:from-ballot-no/20 hover:to-ballot-no/10 border border-ballot-no/20 text-ballot-no font-medium rounded-lg transition-all text-sm"
                >
                  🔴 Super Admin
                </button>
                <button
                  onClick={() => {
                    setUser({
                      id: '00000000-0000-0000-0000-000000000000',
                      email: 'admin@demo.hu',
                      role: 'org_admin',
                      organization_id: '00000000-0000-0000-0000-000000000001',
                      created_at: new Date().toISOString()
                    })
                    navigate('/admin')
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-gold-400/10 to-gold-400/5 hover:from-gold-400/20 hover:to-gold-400/10 border border-gold-400/20 text-gold-700 dark:text-gold-400 font-medium rounded-lg transition-all text-sm"
                >
                  🟠 Org Admin
                </button>
              </div>
            </div>
          </Card>
          
          {/* Back link */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-obsidian-500 dark:text-obsidian-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
            >
              ← {t('common.back')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
