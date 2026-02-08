import { useEffect, useState } from 'react'
import { 
  Vote, ThumbsUp, ThumbsDown, MinusCircle, 
  Lock, CheckCircle, Users, UserCheck, ChevronDown
} from 'lucide-react'
import { useVoteStore } from '../../../stores/voteStore'
import { Button, Card, Spinner } from '../../ui'
import type { AgendaItem, Member, VoteValue, Proxy } from '../../../types/v3'

interface ProxyVotingPanelProps {
  agendaItem: AgendaItem
  member: Member
  proxies: Proxy[] // Proxies where this member is the grantee
  membersMap: Map<string, Member> // For looking up grantor info
}

interface ProxyVote {
  proxyId: string
  grantorId: string
  grantorName: string
  weight: number
  vote: VoteValue | null
  submitted: boolean
}

export function ProxyVotingPanel({ 
  agendaItem, 
  member, 
  proxies, 
  membersMap 
}: ProxyVotingPanelProps) {
  const { 
    submitVote, 
    checkIfVoted, 
    hasVoted, 
    error,
    setCurrentAgendaItem,
    subscribeToVotes,
    unsubscribeFromVotes,
    votes
  } = useVoteStore()

  const [ownVote, setOwnVote] = useState<VoteValue | null>(null)
  const [proxyVotes, setProxyVotes] = useState<ProxyVote[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [expandedProxy, setExpandedProxy] = useState<string | null>(null)

  // Initialize proxy votes from proxies
  useEffect(() => {
    const initialProxyVotes = proxies.map(proxy => {
      const grantor = membersMap.get(proxy.grantor_id)
      return {
        proxyId: proxy.id,
        grantorId: proxy.grantor_id,
        grantorName: grantor?.name || 'Ismeretlen',
        weight: grantor?.weight || 1,
        vote: null,
        submitted: false,
      }
    })
    setProxyVotes(initialProxyVotes)
  }, [proxies, membersMap])

  useEffect(() => {
    setCurrentAgendaItem(agendaItem)
    subscribeToVotes(agendaItem.id)
    checkIfVoted(agendaItem.id, member.id)

    // Check which proxy votes are already submitted
    const checkProxyVotes = async () => {
      const submitted = new Set<string>()
      for (const pv of proxyVotes) {
        const existingVote = votes.find(v => 
          v.agenda_item_id === agendaItem.id && 
          v.proxy_for_id === pv.grantorId
        )
        if (existingVote) {
          submitted.add(pv.grantorId)
        }
      }
      setProxyVotes(prev => prev.map(pv => ({
        ...pv,
        submitted: submitted.has(pv.grantorId)
      })))
    }
    checkProxyVotes()

    return () => {
      unsubscribeFromVotes()
    }
  }, [agendaItem.id, member.id])

  const handleProxyVoteChange = (grantorId: string, vote: VoteValue) => {
    setProxyVotes(prev => prev.map(pv => 
      pv.grantorId === grantorId ? { ...pv, vote } : pv
    ))
  }

  const handleSubmitAll = async () => {
    setSubmitting(true)

    // Submit own vote first
    if (ownVote && !hasVoted) {
      await submitVote({
        agenda_item_id: agendaItem.id,
        member_id: member.id,
        vote: ownVote,
        weight: member.weight,
        is_proxy: false,
      })
    }

    // Submit proxy votes
    for (const pv of proxyVotes) {
      if (pv.vote && !pv.submitted) {
        await submitVote({
          agenda_item_id: agendaItem.id,
          member_id: member.id,
          vote: pv.vote,
          weight: pv.weight,
          is_proxy: true,
          proxy_for_id: pv.grantorId,
        })
        
        // Mark as submitted
        setProxyVotes(prev => prev.map(p => 
          p.grantorId === pv.grantorId ? { ...p, submitted: true } : p
        ))
      }
    }

    setSubmitting(false)
  }

  const voteOptions: { value: VoteValue; label: string; icon: typeof ThumbsUp; color: string }[] = 
    agendaItem.vote_type === 'yes_no' 
      ? [
          { value: 'yes', label: 'Igen', icon: ThumbsUp, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-300' },
          { value: 'no', label: 'Nem', icon: ThumbsDown, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-300' },
        ]
      : [
          { value: 'yes', label: 'Igen', icon: ThumbsUp, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-300' },
          { value: 'no', label: 'Nem', icon: ThumbsDown, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-300' },
          { value: 'abstain', label: 'Tartózkodom', icon: MinusCircle, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 border-gray-300' },
        ]

  const allVoted = hasVoted && proxyVotes.every(pv => pv.submitted)
  const pendingVotes = (!hasVoted && ownVote ? 1 : 0) + proxyVotes.filter(pv => pv.vote && !pv.submitted).length
  const totalWeight = member.weight + proxyVotes.reduce((sum, pv) => sum + pv.weight, 0)

  // All submitted
  if (allVoted) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Minden szavazat rögzítve!
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {proxyVotes.length > 0 
            ? `Saját + ${proxyVotes.length} meghatalmazotti szavazat rögzítve.`
            : 'Szavazatod rögzítve.'}
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Összes súly: {totalWeight.toFixed(2)}
        </div>
      </Card>
    )
  }

  // Voting not active
  if (agendaItem.status !== 'voting') {
    return (
      <Card className="p-8 text-center">
        <Vote className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Szavazás nem aktív
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Várja meg, amíg a levezető elnök megnyitja a szavazást.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-3">
          <Vote className="w-4 h-4" />
          Szavazás aktív
          {agendaItem.is_secret && (
            <span className="flex items-center gap-1 ml-2 pl-2 border-l border-blue-300">
              <Lock className="w-3 h-3" />
              Titkos
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agendaItem.title}
        </h2>
      </div>

      {/* Proxy summary */}
      {proxyVotes.length > 0 && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800 dark:text-purple-300">
              Meghatalmazások ({proxyVotes.length})
            </span>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Ön {proxyVotes.length} tag nevében is szavazhat. Összesített szavazati súly: {totalWeight.toFixed(2)}
          </p>
        </div>
      )}

      {/* Own vote section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-gold-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Saját szavazat
          </h3>
          {hasVoted && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              ✓ Rögzítve
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <span>{member.name}</span>
          <span>•</span>
          <span>Súly: {member.weight.toFixed(2)}</span>
        </div>

        {!hasVoted && (
          <div className="grid grid-cols-3 gap-2">
            {voteOptions.map(option => {
              const Icon = option.icon
              const isSelected = ownVote === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setOwnVote(option.value)}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex flex-col items-center
                    ${isSelected 
                      ? `${option.color} border-current` 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
                  <span className={`text-sm mt-1 ${isSelected ? 'font-medium' : 'text-gray-600'}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Proxy votes section */}
      {proxyVotes.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Meghatalmazotti szavazatok
            </h3>
          </div>

          <div className="space-y-3">
            {proxyVotes.map(pv => (
              <div 
                key={pv.grantorId}
                className={`
                  border rounded-lg overflow-hidden
                  ${pv.submitted 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <button
                  onClick={() => setExpandedProxy(
                    expandedProxy === pv.grantorId ? null : pv.grantorId
                  )}
                  disabled={pv.submitted}
                  className="w-full p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${pv.submitted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-purple-100 text-purple-600'
                      }
                    `}>
                      {pv.submitted ? <CheckCircle className="w-4 h-4" /> : pv.grantorName[0]}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pv.grantorName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Súly: {pv.weight.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {pv.submitted ? (
                    <span className="text-sm text-green-600">Rögzítve</span>
                  ) : pv.vote ? (
                    <span className={`
                      px-2 py-1 text-sm rounded-full
                      ${pv.vote === 'yes' ? 'bg-green-100 text-green-700' :
                        pv.vote === 'no' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {pv.vote === 'yes' ? 'Igen' : pv.vote === 'no' ? 'Nem' : 'Tartózkodom'}
                    </span>
                  ) : (
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedProxy === pv.grantorId ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>

                {expandedProxy === pv.grantorId && !pv.submitted && (
                  <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                    {voteOptions.map(option => {
                      const Icon = option.icon
                      const isSelected = pv.vote === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleProxyVoteChange(pv.grantorId, option.value)}
                          className={`
                            p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-1
                            ${isSelected 
                              ? `${option.color} border-current` 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? '' : 'text-gray-400'}`} />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="mt-6">
        <Button
          onClick={handleSubmitAll}
          disabled={pendingVotes === 0 || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Szavazatok küldése...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {pendingVotes} szavazat leadása
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
