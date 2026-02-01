import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, LogOut, ThumbsUp, ThumbsDown, Minus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { Button, Card, Modal, Badge } from '../../components/ui';
import { Countdown, CountdownBar } from '../../components/shared/Countdown';

type VoteOption = 'yes' | 'no' | 'abstain';

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

export function VoterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { participant, eventId, logout } = useAuthStore();
  const { currentQuestion, results, fetchCurrentQuestion, submitVote } = useEventStore();
  
  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchCurrentQuestion(eventId);
      const interval = setInterval(() => fetchCurrentQuestion(eventId), 5000);
      return () => clearInterval(interval);
    }
  }, [eventId, fetchCurrentQuestion]);

  const handleVote = (option: VoteOption) => {
    setSelectedVote(option);
    setShowConfirmModal(true);
  };

  const confirmVote = async () => {
    if (!selectedVote || !currentQuestion || !participant) return;
    
    setSubmitting(true);
    const success = await submitVote(currentQuestion.id, participant.id, selectedVote);
    setSubmitting(false);
    
    if (success) {
      setHasVoted(true);
      setShowConfirmModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getEndTime = () => {
    if (!currentQuestion?.time_limit || !currentQuestion?.activated_at) return null;
    const activatedAt = new Date(currentQuestion.activated_at);
    return new Date(activatedAt.getTime() + currentQuestion.time_limit * 1000);
  };

  const endTime = getEndTime();

  const voteOptions = [
    { 
      key: 'yes' as VoteOption, 
      icon: ThumbsUp, 
      label: t('common.yes'), 
      color: 'from-ballot-yes to-emerald-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      ring: 'ring-ballot-yes',
    },
    { 
      key: 'no' as VoteOption, 
      icon: ThumbsDown, 
      label: t('common.no'), 
      color: 'from-ballot-no to-red-600',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      ring: 'ring-ballot-no',
    },
    { 
      key: 'abstain' as VoteOption, 
      icon: Minus, 
      label: t('common.abstain'), 
      color: 'from-ballot-abstain to-gray-600',
      bgLight: 'bg-gray-50 dark:bg-gray-800/50',
      ring: 'ring-ballot-abstain',
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-obsidian-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-obsidian-900 dark:bg-obsidian-900/95 backdrop-blur-sm border-b border-obsidian-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BallotIcon className="w-8 h-8" />
              <span className="font-display text-lg font-semibold text-ivory-100">VoteBox</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                <span className="text-sm text-obsidian-300">{participant?.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="!text-obsidian-400 hover:!text-ivory-100 hover:!bg-obsidian-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {!currentQuestion ? (
          // Waiting state
          <Card className="text-center py-16 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/20 flex items-center justify-center animate-float">
                <Clock className="w-12 h-12 text-gold-600 dark:text-gold-400" />
              </div>
              <div className="absolute inset-0 rounded-full ring-4 ring-gold-400/10 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <h2 className="font-display text-display-md text-obsidian-900 dark:text-ivory-100 mb-3">
              {t('voting.awaitingVote')}
            </h2>
            <p className="text-obsidian-500 dark:text-obsidian-400 max-w-sm mx-auto">
              {t('voting.awaitingDesc')}
            </p>
          </Card>
        ) : hasVoted ? (
          // Voted state
          <Card className="text-center py-16 animate-scale-in" style={{ animationFillMode: 'forwards' }}>
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ballot-yes/20 to-emerald-500/10 flex items-center justify-center animate-stamp">
                <Check className="w-14 h-14 text-ballot-yes" strokeWidth={3} />
              </div>
              {/* Sparkle effects */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-gold-400 animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-gold-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <h2 className="font-display text-display-md text-obsidian-900 dark:text-ivory-100 mb-3">
              {t('voting.voteSubmitted')}
            </h2>
            <p className="text-obsidian-500 dark:text-obsidian-400 mb-8">
              {t('voting.voteRecorded')}
            </p>
            
            {results && (
              <div className="pt-8 border-t border-obsidian-100 dark:border-obsidian-800 animate-fade-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
                <h3 className="font-display text-lg text-obsidian-700 dark:text-obsidian-300 mb-6">{t('results.title')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <ResultBadge label={t('common.yes')} value={results.yes} color="text-ballot-yes" bg="bg-emerald-50 dark:bg-emerald-900/20" />
                  <ResultBadge label={t('common.no')} value={results.no} color="text-ballot-no" bg="bg-red-50 dark:bg-red-900/20" />
                  <ResultBadge label={t('common.abstain')} value={results.abstain} color="text-ballot-abstain" bg="bg-gray-100 dark:bg-gray-800/50" />
                </div>
              </div>
            )}
          </Card>
        ) : (
          // Voting state
          <div className="space-y-6">
            {/* Question Card */}
            <Card className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }} padding="lg">
              <div className="flex items-start justify-between gap-4 mb-4">
                <Badge variant="info" dot className="!bg-gold-100 !text-gold-700 dark:!bg-gold-900/30 dark:!text-gold-400">
                  {t('voting.activeVote')}
                </Badge>
                {endTime && (
                  <Countdown 
                    endTime={endTime} 
                    onComplete={() => setHasVoted(true)} 
                  />
                )}
              </div>
              
              {endTime && currentQuestion.time_limit && (
                <div className="mb-6">
                  <CountdownBar endTime={endTime} totalSeconds={currentQuestion.time_limit} />
                </div>
              )}
              
              <h2 className="font-display text-display-md sm:text-display-lg text-obsidian-900 dark:text-ivory-100 leading-tight">
                {currentQuestion.text}
              </h2>
            </Card>

            {/* Vote Buttons */}
            <div className="grid grid-cols-1 gap-4">
              {voteOptions.map((option, index) => (
                <button
                  key={option.key}
                  onClick={() => handleVote(option.key)}
                  className={`
                    vote-btn
                    bg-gradient-to-r ${option.color}
                    text-white font-semibold text-xl
                    p-6 sm:p-8 rounded-2xl
                    flex items-center justify-center gap-4
                    shadow-lg hover:shadow-xl
                    transform hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-300 ease-ballot
                    min-h-[80px]
                    animate-fade-up opacity-0
                  `}
                  style={{ 
                    animationFillMode: 'forwards',
                    animationDelay: `${0.1 + index * 0.1}s`,
                  }}
                >
                  <option.icon className="w-7 h-7" />
                  <span className="font-display tracking-wide">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Hint */}
            <p className="text-center text-sm text-obsidian-400 dark:text-obsidian-500 animate-fade-up opacity-0 stagger-4" style={{ animationFillMode: 'forwards' }}>
              {t('voting.tapToSelect')}
            </p>
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t('voting.confirmVote')}
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="gold" onClick={confirmVote} loading={submitting}>
              {t('voting.castBallot')}
            </Button>
          </div>
        }
      >
        <div className="text-center py-6">
          {/* Selected vote indicator */}
          {selectedVote && (
            <div className={`
              inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-6
              ${voteOptions.find(o => o.key === selectedVote)?.bgLight}
            `}>
              {(() => {
                const option = voteOptions.find(o => o.key === selectedVote);
                const Icon = option?.icon || ThumbsUp;
                return (
                  <>
                    <Icon className={`w-8 h-8 ${
                      selectedVote === 'yes' ? 'text-ballot-yes' :
                      selectedVote === 'no' ? 'text-ballot-no' :
                      'text-ballot-abstain'
                    }`} />
                    <span className={`font-display text-2xl ${
                      selectedVote === 'yes' ? 'text-ballot-yes' :
                      selectedVote === 'no' ? 'text-ballot-no' :
                      'text-ballot-abstain'
                    }`}>
                      {option?.label}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
          
          <p className="text-obsidian-500 dark:text-obsidian-400">
            {t('voting.cannotChange')}
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Result badge component
function ResultBadge({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-obsidian-500 dark:text-obsidian-400 mt-1">{label}</div>
    </div>
  );
}
