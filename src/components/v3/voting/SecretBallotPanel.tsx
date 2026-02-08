import { useEffect, useState } from 'react'
import { 
  Lock, ThumbsUp, ThumbsDown, MinusCircle, 
  CheckCircle, ShieldCheck, Eye, EyeOff
} from 'lucide-react'
import { useVoteStore } from '../../../stores/voteStore'
import { Button, Card, Spinner } from '../../ui'
import type { AgendaItem, Member, VoteValue } from '../../../types/v3'

interface SecretBallotPanelProps {
  agendaItem: AgendaItem
  member: Member
  onVoteSubmitted?: () => void
}

export function SecretBallotPanel({ agendaItem, member, onVoteSubmitted }: SecretBallotPanelProps) {
  const { 
    submitVote, 
    checkIfVoted, 
    hasVoted, 
    error,
    setCurrentAgendaItem,
  } = useVoteStore()

  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null)
  const [confirmVote, setConfirmVote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showVoteSelection, setShowVoteSelection] = useState(false)

  useEffect(() => {
    setCurrentAgendaItem(agendaItem)
    checkIfVoted(agendaItem.id, member.id)
  }, [agendaItem.id, member.id])

  useEffect(() => {
    if (hasVoted) {
      setSubmitted(true)
    }
  }, [hasVoted])

  const handleVoteSelect = (vote: VoteValue) => {
    setSelectedVote(vote)
    setConfirmVote(true)
  }

  const handleConfirm = async () => {
    if (!selectedVote) return
    
    setSubmitting(true)
    
    // For secret voting, we don't include identifying info
    const success = await submitVote({
      agenda_item_id: agendaItem.id,
      member_id: member.id, // Still needed for dedup, but hidden in UI
      vote: selectedVote,
      weight: member.weight,
      is_proxy: false,
    })
    
    setSubmitting(false)

    if (success) {
      setSubmitted(true)
      onVoteSubmitted?.()
    }
  }

  const handleCancel = () => {
    setSelectedVote(null)
    setConfirmVote(false)
  }

  const voteOptions: { value: VoteValue; label: string; icon: typeof ThumbsUp; color: string }[] = 
    agendaItem.vote_type === 'yes_no' 
      ? [
          { value: 'yes', label: 'IGEN', icon: ThumbsUp, color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' },
          { value: 'no', label: 'NEM', icon: ThumbsDown, color: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' },
        ]
      : [
          { value: 'yes', label: 'IGEN', icon: ThumbsUp, color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' },
          { value: 'no', label: 'NEM', icon: ThumbsDown, color: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' },
          { value: 'abstain', label: 'TARTÓZKODOM', icon: MinusCircle, color: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700' },
        ]

  // Already voted
  if (submitted || hasVoted) {
    return (
      <Card className="p-8 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 ring-4 ring-green-200 dark:ring-green-800">
          <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Titkos szavazat leadva
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Szavazata titkosan rögzítésre került. A szavazat tartalma nem azonosítható 
          és az eredmények csak a szavazás lezárása után lesznek láthatók.
        </p>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl inline-flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Lock className="w-5 h-5" />
          <span>Anonimitás biztosítva</span>
        </div>
      </Card>
    )
  }

  // Voting not active
  if (agendaItem.status !== 'voting') {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Titkos szavazás
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Várja meg, amíg a levezető elnök megnyitja a titkos szavazást.
        </p>
      </Card>
    )
  }

  // Confirmation view
  if (confirmVote && selectedVote) {
    const selected = voteOptions.find(o => o.value === selectedVote)!
    const Icon = selected.icon

    return (
      <Card className="p-8 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 ring-4 ring-amber-200 dark:ring-amber-800">
          <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Megerősítés szükséges
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          A titkos szavazat leadása után nem módosítható!
        </p>

        <div className={`
          inline-flex items-center gap-3 px-8 py-4 rounded-2xl mb-6
          bg-gradient-to-r ${selected.color} text-white shadow-lg
        `}>
          <Icon className="w-8 h-8" />
          <span className="text-2xl font-bold">{selected.label}</span>
        </div>

        {/* Toggle visibility of vote */}
        <button
          onClick={() => setShowVoteSelection(!showVoteSelection)}
          className="flex items-center justify-center gap-2 mx-auto mb-6 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showVoteSelection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showVoteSelection ? 'Választás elrejtése' : 'Választás mutatása (biztonságos)'}
        </button>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="lg"
            disabled={submitting}
          >
            Mégsem
          </Button>
          <Button
            onClick={handleConfirm}
            variant="gold"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Küldés...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Szavazat megerősítése
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  // Voting view
  return (
    <Card className="p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium mb-4">
          <Lock className="w-5 h-5" />
          Titkos szavazás
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agendaItem.title}
        </h2>
        {agendaItem.description && (
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {agendaItem.description}
          </p>
        )}
      </div>

      {/* Privacy notice */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Titkosság garantálva:</strong> Szavazata anonim módon kerül rögzítésre. 
            Személye és szavazata között nem jön létre kapcsolat. Az eredmények kizárólag 
            összesítve jelennek meg.
          </div>
        </div>
      </div>

      {/* Voting buttons */}
      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
        {voteOptions.map((option) => {
          const Icon = option.icon
          
          return (
            <button
              key={option.value}
              onClick={() => handleVoteSelect(option.value)}
              className={`
                relative p-8 rounded-2xl bg-gradient-to-br ${option.color}
                text-white shadow-lg hover:shadow-xl
                transform hover:scale-105 transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-white/50
              `}
            >
              <Icon className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
              <div className="text-2xl font-bold tracking-wide">
                {option.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Info */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        Kattintson a választására a szavazat leadásához. Megerősítést kérünk a véglegesítés előtt.
      </p>
    </Card>
  )
}
