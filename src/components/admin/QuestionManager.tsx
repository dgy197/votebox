import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HelpCircle, Plus, Trash2, Play, Square, ChevronDown, ChevronUp,
  GripVertical, BarChart3, AlertTriangle, Users
} from 'lucide-react'
import { CountdownTimer } from '../shared/CountdownTimer'
import type { Question, QuorumType } from '../../types'

interface QuorumInfo {
  quorumType: QuorumType
  quorumValue: number
  presentCount: number
  totalCount: number
}

interface QuestionManagerProps {
  questions: Question[]
  voteCountMap: Record<string, number>
  totalParticipants: number
  quorumInfo?: QuorumInfo
  onAdd: (data: Partial<Question>) => Promise<void>
  onUpdate: (id: string, data: Partial<Question>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onActivate: (id: string) => Promise<void>
  onClose: (id: string) => Promise<void>
  onShowResults: (question: Question) => void
}

// Helper function to check if quorum is met
function checkQuorum(info: QuorumInfo | undefined): boolean {
  if (!info || info.quorumType === 'none') return true

  if (info.quorumType === 'percentage') {
    const requiredCount = Math.ceil((info.quorumValue / 100) * info.totalCount)
    return info.presentCount >= requiredCount
  }

  if (info.quorumType === 'fixed') {
    return info.presentCount >= info.quorumValue
  }

  return true
}

// Quorum warning component
function QuorumWarning({ info, t }: { info: QuorumInfo; t: (key: string) => string }) {
  const isQuorumMet = checkQuorum(info)

  if (info.quorumType === 'none') return null

  const requiredCount = info.quorumType === 'percentage'
    ? Math.ceil((info.quorumValue / 100) * info.totalCount)
    : info.quorumValue

  const label = info.quorumType === 'percentage'
    ? `${info.quorumValue}% (${requiredCount} fő)`
    : `${info.quorumValue} fő`

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      isQuorumMet
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
    }`}>
      {isQuorumMet ? (
        <Users className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      <span>
        {isQuorumMet ? t('quorum.met') : t('quorum.notMet')}
        {' • '}
        {t('quorum.present')}: {info.presentCount}/{info.totalCount}
        {' • '}
        {t('quorum.required')}: {label}
      </span>
    </div>
  )
}

export function QuestionManager({
  questions,
  voteCountMap,
  totalParticipants,
  quorumInfo,
  onAdd,
  onUpdate,
  onDelete,
  onActivate,
  onClose,
  onShowResults,
}: QuestionManagerProps) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showQuorumWarning, setShowQuorumWarning] = useState(false)
  const [pendingActivateId, setPendingActivateId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeQuestion = questions.find(q => q.state === 'active')
  const isQuorumMet = checkQuorum(quorumInfo)

  const handleActivate = async (id: string) => {
    if (isSubmitting) return
    if (!isQuorumMet && quorumInfo) {
      setShowQuorumWarning(true)
      setPendingActivateId(id)
      return
    }
    setIsSubmitting(true)
    try {
      await onActivate(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async (id: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onClose(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onDelete(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmActivateWithoutQuorum = async () => {
    if (pendingActivateId && !isSubmitting) {
      setIsSubmitting(true)
      try {
        await onActivate(pendingActivateId)
      } finally {
        setIsSubmitting(false)
      }
    }
    setShowQuorumWarning(false)
    setPendingActivateId(null)
  }
  
  const getStateColor = (state: Question['state']) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 animate-pulse'
      case 'closed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const getStateText = (state: Question['state']) => {
    switch (state) {
      case 'draft': return 'Vázlat'
      case 'active': return '🔴 ÉLŐ'
      case 'closed': return 'Lezárt'
      default: return state
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('questions.title')}
            </h3>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {questions.length} kérdés
            </span>
          </div>
          <button
            onClick={() => { setEditingQuestion(null); setShowForm(true) }}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('questions.create')}
          </button>
        </div>
        {/* Quorum indicator */}
        {quorumInfo && quorumInfo.quorumType !== 'none' && (
          <div className="mt-3">
            <QuorumWarning info={quorumInfo} t={t} />
          </div>
        )}
      </div>

      {/* Quorum warning modal */}
      {showQuorumWarning && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="quorum-warning-title"
          aria-describedby="quorum-warning-desc"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              <h3 id="quorum-warning-title" className="text-lg font-semibold">{t('quorum.notMet')}</h3>
            </div>
            <div id="quorum-warning-desc">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {quorumInfo && (
                  <>
                    {t('quorum.present')}: {quorumInfo.presentCount}/{quorumInfo.totalCount}
                    {' • '}
                    {t('quorum.required')}: {
                      quorumInfo.quorumType === 'percentage'
                        ? `${quorumInfo.quorumValue}% (${Math.ceil((quorumInfo.quorumValue / 100) * quorumInfo.totalCount)} fő)`
                        : `${quorumInfo.quorumValue} fő`
                    }
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Biztosan el szeretnéd indítani a szavazást kvórum nélkül?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowQuorumWarning(false); setPendingActivateId(null) }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmActivateWithoutQuorum}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? t('common.loading') : 'Indítás mégis'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Question form */}
      {showForm && (
        <QuestionForm
          question={editingQuestion}
          orderIndex={questions.length}
          onSave={async (data) => {
            if (editingQuestion) {
              await onUpdate(editingQuestion.id, data)
            } else {
              await onAdd(data)
            }
            setShowForm(false)
            setEditingQuestion(null)
          }}
          onCancel={() => { setShowForm(false); setEditingQuestion(null) }}
        />
      )}
      
      {/* Active question highlight */}
      {activeQuestion && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Aktív kérdés
                </span>
                {activeQuestion.time_limit_seconds && activeQuestion.activated_at && (
                  <CountdownTimer
                    activatedAt={activeQuestion.activated_at}
                    durationSeconds={activeQuestion.time_limit_seconds}
                    onExpire={() => onClose(activeQuestion.id)}
                    size="md"
                    warningThreshold={10}
                  />
                )}
              </div>
              <p className="mt-1 font-medium text-green-900 dark:text-green-100">
                {activeQuestion.text_hu}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {voteCountMap[activeQuestion.id] || 0}/{totalParticipants}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">szavazat</p>
              </div>
              <button
                onClick={() => handleClose(activeQuestion.id)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                {isSubmitting ? t('common.loading') : t('questions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Questions list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Még nincs kérdés</p>
            <p className="text-sm">Hozz létre egyet a szavazáshoz!</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 text-gray-400 mt-1">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-mono w-6">{index + 1}.</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {question.text_hu}
                      </p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStateColor(question.state)}`}>
                        {getStateText(question.state)}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{t(`questions.type.${question.type}`)}</span>
                      {question.state === 'closed' && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {voteCountMap[question.id] || 0} szavazat
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {question.state === 'draft' && (
                      <>
                        <button
                          onClick={() => handleActivate(question.id)}
                          disabled={isSubmitting}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 rounded-lg transition-colors"
                          title={t('questions.activate')}
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setEditingQuestion(question); setShowForm(true) }}
                          disabled={isSubmitting}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <HelpCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          disabled={isSubmitting}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {question.state === 'active' && (
                      <button
                        onClick={() => handleClose(question.id)}
                        disabled={isSubmitting}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 rounded-lg transition-colors"
                        title={t('questions.close')}
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    )}
                    {question.state === 'closed' && (
                      <button
                        onClick={() => onShowResults(question)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={t('questions.results')}
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                      className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {expandedId === question.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedId === question.id && (
                  <div className="mt-4 ml-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Típus:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {t(`questions.type.${question.type}`)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Küszöb:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {question.threshold_type === 'simple_majority' && 'Egyszerű többség (>50%)'}
                          {question.threshold_type === 'two_thirds' && 'Kétharmad (≥66.67%)'}
                          {question.threshold_type === 'absolute' && 'Abszolút többség'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Titkos:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {question.is_anonymous ? 'Igen' : 'Nem'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tartózkodás számít:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {question.abstain_counts ? 'Igen' : 'Nem'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Időkorlát:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {question.time_limit_seconds 
                            ? `${Math.floor(question.time_limit_seconds / 60)}:${(question.time_limit_seconds % 60).toString().padStart(2, '0')}`
                            : 'Nincs'}
                        </span>
                      </div>
                      {question.activated_at && (
                        <div>
                          <span className="text-gray-500">Aktiválva:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(question.activated_at).toLocaleString('hu-HU')}
                          </span>
                        </div>
                      )}
                      {question.closed_at && (
                        <div>
                          <span className="text-gray-500">Lezárva:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(question.closed_at).toLocaleString('hu-HU')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Question Form Component
interface QuestionFormProps {
  question: Question | null
  orderIndex: number
  onSave: (data: Partial<Question>) => Promise<void>
  onCancel: () => void
}

function QuestionForm({ question, orderIndex, onSave, onCancel }: QuestionFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    text_hu: question?.text_hu || '',
    text_en: question?.text_en || '',
    type: question?.type || 'binary' as const,
    threshold_type: question?.threshold_type || 'simple_majority' as const,
    is_anonymous: question?.is_anonymous ?? true,
    abstain_counts: question?.abstain_counts ?? true,
    time_limit_seconds: question?.time_limit_seconds || null as number | null,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        text_hu: formData.text_hu,
        text_en: formData.text_en,
        type: formData.type,
        threshold_type: formData.threshold_type,
        is_anonymous: formData.is_anonymous,
        abstain_counts: formData.abstain_counts,
        time_limit_seconds: formData.time_limit_seconds,
        order_index: orderIndex,
        options: formData.type === 'binary' ? [
          { id: 'yes', label_hu: 'Igen', label_en: 'Yes' },
          { id: 'no', label_hu: 'Nem', label_en: 'No' },
          { id: 'abstain', label_hu: 'Tartózkodom', label_en: 'Abstain' },
        ] : null,
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kérdés szövege (magyar) *
          </label>
          <textarea
            value={formData.text_hu}
            onChange={(e) => setFormData({ ...formData, text_hu: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            placeholder="pl. Elfogadja-e a közgyűlés a beszámolót?"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Szavazás típusa
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="binary">{t('questions.type.binary')}</option>
              <option value="single" disabled>{t('questions.type.single')} (hamarosan)</option>
              <option value="multi" disabled>{t('questions.type.multi')} (hamarosan)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Elfogadási küszöb
            </label>
            <select
              value={formData.threshold_type}
              onChange={(e) => setFormData({ ...formData, threshold_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="simple_majority">Egyszerű többség (&gt;50%)</option>
              <option value="two_thirds">Kétharmad (≥66.67%)</option>
              <option value="absolute">Abszolút többség</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Időkorlát (másodperc)
          </label>
          <div className="flex items-center gap-3">
            <select
              value={formData.time_limit_seconds || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                time_limit_seconds: e.target.value ? parseInt(e.target.value) : null 
              })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Nincs időkorlát</option>
              <option value="30">30 mp</option>
              <option value="60">1 perc</option>
              <option value="120">2 perc</option>
              <option value="180">3 perc</option>
              <option value="300">5 perc</option>
              <option value="600">10 perc</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formData.time_limit_seconds 
                ? `A szavazás automatikusan zárul ${formData.time_limit_seconds} mp után`
                : 'Manuális lezárás'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Titkos szavazás</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.abstain_counts}
              onChange={(e) => setFormData({ ...formData, abstain_counts: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Tartózkodás számít</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
