import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Moon, Sun, Globe, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import * as api from '../../services/supabaseService';
import { Button, Card, Input } from '../../components/ui';

// Ballot icon component
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

export function VoterLogin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { eventCode: urlEventCode } = useParams();
  const { setParticipant } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  
  const [eventCode, setEventCode] = useState(urlEventCode || '');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode || !accessCode) return;

    setLoading(true);
    setError('');

    try {
      const event = await api.getEventByCode(eventCode);
      if (!event) {
        setError('Esemény nem található');
        setLoading(false);
        return;
      }

      const participant = await api.verifyParticipant(event.id, accessCode);
      if (!participant) {
        setError('Érvénytelen belépési kód');
        setLoading(false);
        return;
      }

      setParticipant(participant, event.id);
      navigate('/voting');
    } catch (err) {
      setError('Hiba történt a bejelentkezés során');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setParticipant({
      id: 'demo-participant',
      event_id: 'demo-event',
      name: 'Demo Szavazó',
      email: 'demo@example.com',
      access_code: 'DEMO',
      is_present: true,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }, 'demo-event');
    navigate('/voting');
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'hu' ? 'en' : 'hu');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-ivory-100 dark:bg-obsidian-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-radial from-gold-400/10 via-gold-400/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-obsidian-400/10 via-obsidian-400/5 to-transparent blur-3xl dark:from-gold-500/5" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BallotIcon className="w-10 h-10" />
            <span className="font-display text-2xl font-semibold text-obsidian-900 dark:text-ivory-100 tracking-tight">
              VoteBox
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="text-obsidian-500">
              <Globe className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-obsidian-500">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <div className="text-center mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <h1 className="font-display text-display-lg sm:text-display-xl text-obsidian-900 dark:text-ivory-100 mb-3">
              {t('auth.secureVoting')}
            </h1>
            <p className="text-lg text-obsidian-500 dark:text-obsidian-400">
              {t('auth.enterCredentials')}
            </p>
          </div>

          {/* Login Card */}
          <Card 
            className="animate-fade-up opacity-0 stagger-1" 
            style={{ animationFillMode: 'forwards' }}
            padding="lg"
            accent="top"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/20 flex items-center justify-center shadow-glow-gold/30">
                  <Fingerprint className="w-10 h-10 text-gold-600 dark:text-gold-400" />
                </div>
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-gold-400/20 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.eventCode')}
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                error={error && !eventCode ? 'Required field' : undefined}
                className="uppercase tracking-[0.2em] text-center font-mono"
              />

              <Input
                label={t('auth.accessCode')}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="XYZ789"
                error={error && !accessCode ? 'Required field' : undefined}
                className="uppercase tracking-[0.2em] text-center font-mono"
              />

              {error && eventCode && accessCode && (
                <div className="p-4 bg-ballot-no/5 border border-ballot-no/20 rounded-xl text-ballot-no text-sm flex items-center gap-3 animate-slide-up">
                  <div className="w-8 h-8 rounded-full bg-ballot-no/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                variant="gold"
                className="w-full mt-2" 
                size="lg"
                loading={loading}
                disabled={!eventCode || !accessCode}
              >
                {t('auth.enterBallot')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-obsidian-200 dark:via-obsidian-700 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-obsidian-400 dark:text-obsidian-500 bg-white dark:bg-obsidian-900/80">
                  {t('auth.orTry')}
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full group" 
              onClick={handleDemo}
            >
              <span className="text-xl mr-2 group-hover:animate-bounce">🎭</span>
              {t('auth.demoMode')}
            </Button>
          </Card>

          {/* Footer note */}
          <p className="text-center text-sm text-obsidian-400 dark:text-obsidian-500 mt-6 animate-fade-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
            {t('auth.voteEncrypted')}
          </p>
        </div>
      </main>
    </div>
  );
}
