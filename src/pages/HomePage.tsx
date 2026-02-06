import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Vote, Shield, Users, Zap, Moon, Sun, Globe } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { Button, Card } from '../components/ui';

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

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const toggleLang = () => {
    const newLang = i18n.language === 'hu' ? 'en' : 'hu';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const features = [
    {
      icon: Shield,
      titleKey: 'home.featureSecure',
      descKey: 'home.featureSecureDesc',
      color: 'text-gold-600 bg-gold-100 dark:bg-gold-900/30',
    },
    {
      icon: Zap,
      titleKey: 'home.featureRealtime',
      descKey: 'home.featureRealtimeDesc',
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      icon: Users,
      titleKey: 'home.featureSimple',
      descKey: 'home.featureSimpleDesc',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-obsidian-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-radial from-gold-400/10 via-gold-400/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-obsidian-400/10 via-obsidian-400/5 to-transparent blur-3xl dark:from-gold-500/5" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory-100/80 dark:bg-obsidian-950/80 border-b border-obsidian-100 dark:border-obsidian-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BallotIcon className="w-10 h-10" />
              <span className="font-display text-2xl font-semibold text-obsidian-900 dark:text-ivory-100">{t('app.name')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={toggleLang}>
                <Globe className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">{i18n.language.toUpperCase()}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 dark:bg-gold-900/30 rounded-full text-gold-700 dark:text-gold-400 text-sm font-medium mb-8 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            <Vote className="w-4 h-4" />
            {t('app.tagline')}
          </div>
          
          <h1 className="font-display text-display-xl sm:text-display-2xl text-obsidian-900 dark:text-ivory-100 mb-6 animate-fade-up opacity-0 stagger-1" style={{ animationFillMode: 'forwards' }}>
            {t('home.heroTitle1')}
            <br />
            <span className="text-gradient-gold">{t('home.heroTitle2')}</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-obsidian-500 dark:text-obsidian-400 max-w-2xl mx-auto mb-10 animate-fade-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
            {t('home.heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up opacity-0 stagger-3" style={{ animationFillMode: 'forwards' }}>
            <Link to="/vote">
              <Button variant="gold" size="xl" className="w-full sm:w-auto">
                <Vote className="w-5 h-5" />
                {t('home.castVote')}
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <Shield className="w-5 h-5" />
                {t('home.adminLogin')}
              </Button>
            </Link>
          </div>
          
          {/* VoteBox 3.0 Preview */}
          <div className="mt-8 animate-fade-up opacity-0 stagger-4" style={{ animationFillMode: 'forwards' }}>
            <Link to="/v3" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              VoteBox 3.0 Preview — Súlyozott szavazás, gyűléskezelés
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-display-md text-obsidian-900 dark:text-ivory-100 text-center mb-16">
            {t('home.whyChoose')}
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.titleKey} 
                hover 
                className="text-center animate-fade-up opacity-0"
                style={{ animationFillMode: 'forwards', animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-5`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl text-obsidian-900 dark:text-ivory-100 mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-obsidian-500 dark:text-obsidian-400">
                  {t(feature.descKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <Card 
            className="!bg-gradient-to-br from-obsidian-900 to-obsidian-950 dark:from-obsidian-800 dark:to-obsidian-900 text-center overflow-hidden"
            padding="xl"
          >
            {/* Gold accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            
            <h2 className="font-display text-display-md text-ivory-100 mb-4">
              {t('home.readyToVote')}
            </h2>
            <p className="text-obsidian-300 mb-8 max-w-lg mx-auto">
              {t('home.readyToVoteDesc')}
            </p>
            <Link to="/vote">
              <Button variant="gold" size="lg">
                {t('home.enterBallot')}
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-4 py-8 border-t border-obsidian-100 dark:border-obsidian-800">
        <div className="max-w-5xl mx-auto text-center text-sm text-obsidian-400 dark:text-obsidian-500">
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
