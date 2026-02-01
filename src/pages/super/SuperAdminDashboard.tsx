import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Users, LogIn, Trash2, Menu, X, Moon, Sun, Globe, Zap } from 'lucide-react';
import { useSuperAdminStore } from '../../stores/superAdminStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, Modal, Input, Badge, EmptyState, LoadingScreen } from '../../components/ui';
import type { Organization } from '../../types';

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

export default function SuperAdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const { 
    organizations, 
    isLoading, 
    error,
    fetchOrganizations, 
    createOrganization, 
    deleteOrganization,
    impersonateOrg 
  } = useSuperAdminStore();

  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) return;
    
    setCreating(true);
    const org = await createOrganization(newOrgName, newOrgSlug);
    setCreating(false);
    
    if (org) {
      setShowNewOrgModal(false);
      setNewOrgName('');
      setNewOrgSlug('');
    }
  };

  const handleImpersonate = (org: Organization) => {
    impersonateOrg(org.id);
    navigate('/admin');
  };

  const handleDeleteOrg = async (id: string, name: string) => {
    if (window.confirm(`${t('super.confirmDelete')}\n\n"${name}"`)) {
      await deleteOrganization(id);
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'hu' ? 'en' : 'hu';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-obsidian-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-ballot-no/5 via-ballot-no/2 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-radial from-gold-400/5 via-gold-400/2 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-obsidian-900/95 dark:bg-obsidian-950/95 text-white border-b border-obsidian-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <BallotIcon className="w-10 h-10" />
              <div className="hidden sm:block">
                <h1 className="font-display text-lg font-semibold text-ivory-100">VoteBox</h1>
                <p className="text-ballot-no text-xs font-medium">Super Admin</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-obsidian-400 mr-2">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={toggleLang} className="!text-obsidian-300 hover:!text-ivory-100 hover:!bg-obsidian-800">
                <Globe className="w-4 h-4" />
                <span className="ml-1">{i18n.language.toUpperCase()}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="!text-obsidian-300 hover:!text-ivory-100 hover:!bg-obsidian-800">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="!text-obsidian-300 hover:!text-ivory-100 hover:!bg-obsidian-800">
                {t('auth.logout')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-obsidian-800 rounded-lg text-obsidian-300"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-obsidian-700 mt-2 pt-4">
              <p className="text-obsidian-400 text-sm mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={toggleLang} className="!text-obsidian-300 hover:!text-ivory-100">
                  <Globe className="w-4 h-4" />
                  <span className="ml-1">{i18n.language.toUpperCase()}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleTheme} className="!text-obsidian-300 hover:!text-ivory-100">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={logout} className="!text-obsidian-300 hover:!text-ivory-100">
                  {t('auth.logout')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-display text-display-md text-obsidian-900 dark:text-ivory-100 mb-2">
            Command Center
          </h1>
          <p className="text-obsidian-500 dark:text-obsidian-400">
            Manage all organizations and system settings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="col-span-1" hover>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-ballot-no/10 dark:bg-ballot-no/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-ballot-no" />
              </div>
              <div>
                <p className="text-sm text-obsidian-500 dark:text-obsidian-400">{t('super.organizations')}</p>
                <p className="font-display text-2xl font-semibold text-obsidian-900 dark:text-ivory-100">{organizations.length}</p>
              </div>
            </div>
          </Card>

          <Card className="col-span-1" hover>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold-600 dark:text-gold-400" />
              </div>
              <div>
                <p className="text-sm text-obsidian-500 dark:text-obsidian-400">{t('super.totalUsers')}</p>
                <p className="font-display text-2xl font-semibold text-obsidian-900 dark:text-ivory-100">—</p>
              </div>
            </div>
          </Card>

          <Card className="col-span-2 lg:col-span-1" hover>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-ballot-yes/10 dark:bg-ballot-yes/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-ballot-yes" />
              </div>
              <div>
                <p className="text-sm text-obsidian-500 dark:text-obsidian-400">{t('super.systemStatus')}</p>
                <Badge variant="success" dot>Online</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Organizations Card */}
        <Card padding="none" className="overflow-hidden">
          {/* Gold accent line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-ballot-no to-transparent" />
          
          <div className="p-6 border-b border-obsidian-100 dark:border-obsidian-800">
            <CardHeader
              title={t('super.organizations')}
              action={
                <Button variant="gold" onClick={() => setShowNewOrgModal(true)}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('super.newOrganization')}</span>
                  <span className="sm:hidden">Új</span>
                </Button>
              }
            />
          </div>

          {error && (
            <div className="p-4 bg-ballot-no/10 border-b border-ballot-no/20 text-ballot-no text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <LoadingScreen />
          ) : organizations.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-8 h-8 text-obsidian-400" />}
              title={t('super.noOrganizations')}
              description="Hozd létre az első szervezetedet a kezdéshez"
              action={{
                label: t('super.newOrganization'),
                onClick: () => setShowNewOrgModal(true)
              }}
            />
          ) : (
            <div className="divide-y divide-obsidian-100 dark:divide-obsidian-800">
              {organizations.map((org) => (
                <div 
                  key={org.id} 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-obsidian-50 dark:hover:bg-obsidian-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-100 dark:bg-obsidian-800 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-obsidian-500 dark:text-obsidian-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-obsidian-900 dark:text-ivory-100 truncate">{org.name}</h3>
                      <p className="text-sm text-obsidian-500 dark:text-obsidian-400">/{org.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleImpersonate(org)}
                    >
                      <LogIn className="w-4 h-4" />
                      {t('super.enterOrg')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrg(org.id, org.name)}
                      className="!text-ballot-no hover:!bg-ballot-no/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* New Organization Modal */}
      <Modal
        isOpen={showNewOrgModal}
        onClose={() => setShowNewOrgModal(false)}
        title={t('super.newOrganization')}
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setShowNewOrgModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="gold"
              onClick={handleCreateOrg} 
              disabled={!newOrgName || !newOrgSlug}
              loading={creating}
            >
              {t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('super.orgName')}
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="Acme Corporation"
          />
          <Input
            label={t('super.orgSlug')}
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
            placeholder="acme"
            hint="URL-ben használt azonosító (csak kisbetűk és kötőjel)"
          />
        </div>
      </Modal>
    </div>
  );
}
