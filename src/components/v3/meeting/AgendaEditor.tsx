import { useState, useEffect } from 'react'
import { Plus, GripVertical, Trash2, Edit2, Check, X, Vote, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { useMeetingStore } from '../../../stores/meetingStore'
import { Button, Card, Input, Badge, Spinner } from '../../ui'
import type { AgendaItem, VoteType, RequiredMajority } from '../../../types/v3'

const voteTypes: { value: VoteType; label: string }[] = [
  { value: 'yes_no_abstain', label: 'Igen / Nem / Tartózkodom' },
  { value: 'yes_no', label: 'Igen / Nem' },
  { value: 'multiple_choice', label: 'Többszörös választás' },
  { value: 'none', label: 'Nincs szavazás (tájékoztató)' },
]

const majorityTypes: { value: RequiredMajority; label: string }[] = [
  { value: 'simple', label: 'Egyszerű többség' },
  { value: 'two_thirds', label: 'Kétharmados' },
  { value: 'unanimous', label: 'Egyhangú' },
]

interface AgendaEditorProps {
  meetingId: string
}

interface AgendaItemRowProps {
  item: AgendaItem
  onEdit: () => void
  onDelete: () => void
  isEditing: boolean
}

function AgendaItemRow({ item, onEdit, onDelete, isEditing }: AgendaItemRowProps) {
  const statusColors = {
    pending: 'secondary',
    in_progress: 'warning',
    voting: 'primary',
    completed: 'success',
  } as const

  const statusLabels = {
    pending: 'Várakozik',
    in_progress: 'Folyamatban',
    voting: 'Szavazás',
    completed: 'Lezárva',
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="text-gray-400 cursor-grab">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
        {item.order_num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {item.title}
          </h4>
          {item.is_secret && (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">
            {voteTypes.find((v) => v.value === item.vote_type)?.label}
          </span>
          {item.vote_type !== 'none' && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">
                {majorityTypes.find((m) => m.value === item.required_majority)?.label}
              </span>
            </>
          )}
        </div>
      </div>
      <Badge variant={statusColors[item.status]} size="sm">
        {statusLabels[item.status]}
      </Badge>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface AgendaItemFormProps {
  meetingId: string
  item?: AgendaItem
  orderNum: number
  onSave: () => void
  onCancel: () => void
}

function AgendaItemForm({ meetingId, item, orderNum, onSave, onCancel }: AgendaItemFormProps) {
  const { createAgendaItem, updateAgendaItem, loading } = useMeetingStore()

  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [voteType, setVoteType] = useState<VoteType>(item?.vote_type || 'yes_no_abstain')
  const [requiredMajority, setRequiredMajority] = useState<RequiredMajority>(
    item?.required_majority || 'simple'
  )
  const [isSecret, setIsSecret] = useState(item?.is_secret || false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (item) {
      const success = await updateAgendaItem(item.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        vote_type: voteType,
        required_majority: requiredMajority,
        is_secret: isSecret,
      })
      if (success) onSave()
    } else {
      const created = await createAgendaItem({
        meeting_id: meetingId,
        order_num: orderNum,
        title: title.trim(),
        description: description.trim() || undefined,
        vote_type: voteType,
        required_majority: requiredMajority,
        is_secret: isSecret,
      })
      if (created) onSave()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b dark:border-gray-700">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300">
          {orderNum}
        </div>
        <div className="flex-1 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Napirendi pont címe"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Leírás (opcionális)"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Szavazás típusa
              </label>
              <select
                value={voteType}
                onChange={(e) => setVoteType(e.target.value as VoteType)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {voteTypes.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {voteType !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Szükséges többség
                </label>
                <select
                  value={requiredMajority}
                  onChange={(e) => setRequiredMajority(e.target.value as RequiredMajority)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {majorityTypes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            További beállítások
          </button>

          {showAdvanced && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="isSecret"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isSecret" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Titkos szavazás
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Mégse
            </Button>
            <Button type="submit" size="sm" disabled={loading || !title.trim()}>
              <Check className="w-4 h-4 mr-1" />
              {loading ? 'Mentés...' : item ? 'Mentés' : 'Hozzáadás'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export function AgendaEditor({ meetingId }: AgendaEditorProps) {
  const { agendaItems, loading, fetchAgendaItems, deleteAgendaItem } = useMeetingStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    fetchAgendaItems(meetingId)
  }, [meetingId, fetchAgendaItems])

  const handleDelete = async (id: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a napirendi pontot?')) {
      await deleteAgendaItem(id)
    }
  }

  const nextOrderNum = agendaItems.length > 0
    ? Math.max(...agendaItems.map((i) => i.order_num)) + 1
    : 1

  if (loading && agendaItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Vote className="w-5 h-5" />
          Napirendi pontok
        </h3>
        <Button size="sm" onClick={() => setShowNewForm(true)} disabled={showNewForm}>
          <Plus className="w-4 h-4 mr-1" />
          Új pont
        </Button>
      </div>

      <Card className="overflow-hidden">
        {agendaItems.length === 0 && !showNewForm ? (
          <div className="p-8 text-center">
            <Vote className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Még nincsenek napirendi pontok
            </p>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Első pont hozzáadása
            </Button>
          </div>
        ) : (
          <div>
            {agendaItems.map((item) =>
              editingId === item.id ? (
                <AgendaItemForm
                  key={item.id}
                  meetingId={meetingId}
                  item={item}
                  orderNum={item.order_num}
                  onSave={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <AgendaItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingId(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  isEditing={false}
                />
              )
            )}

            {showNewForm && (
              <AgendaItemForm
                meetingId={meetingId}
                orderNum={nextOrderNum}
                onSave={() => setShowNewForm(false)}
                onCancel={() => setShowNewForm(false)}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
