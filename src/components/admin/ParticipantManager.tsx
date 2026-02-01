import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Trash2, Copy, Check, Users, RefreshCw, Download } from 'lucide-react'
import type { Participant } from '../../types'
import { generateAccessCode } from '../../services/supabaseService'

interface ParticipantManagerProps {
  participants: Participant[]
  onAdd: (name: string, email?: string) => Promise<void>
  onAddBulk: (participants: { name: string; email?: string }[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRegenerateCode: (id: string, newCode: string) => Promise<void>
}

export function ParticipantManager({ 
  participants, 
  onAdd, 
  onAddBulk, 
  onDelete, 
  onRegenerateCode 
}: ParticipantManagerProps) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const presentCount = participants.filter(p => p.is_present).length
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onAdd(name, email || undefined)
      setName('')
      setEmail('')
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }
  
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const lines = bulkText.split('\n').filter(line => line.trim())
      const newParticipants = lines.map(line => {
        const [name, email] = line.split(',').map(s => s.trim())
        return { name, email: email || undefined }
      })
      await onAddBulk(newParticipants)
      setBulkText('')
      setShowBulkForm(false)
    } finally {
      setLoading(false)
    }
  }
  
  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const exportCodes = () => {
    const csv = participants.map(p => `${p.name},${p.email || ''},${p.access_code}`).join('\n')
    const blob = new Blob([`Név,Email,Belépési kód\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resztvevok.csv'
    a.click()
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Résztvevők
            </h3>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {presentCount}/{participants.length} jelen
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCodes}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Exportálás"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowBulkForm(true)}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Tömeges hozzáadás
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Hozzáadás
            </button>
          </div>
        </div>
      </div>
      
      {/* Add form */}
      {showForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Név *"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (opcionális)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '...' : 'Mentés'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm rounded-lg transition-colors"
            >
              Mégse
            </button>
          </form>
        </div>
      )}
      
      {/* Bulk add form */}
      {showBulkForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleBulkAdd}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Soronként egy résztvevő: <code>Név, email</code>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Kiss János, kiss.janos@email.hu&#10;Nagy Péter, nagy.peter@email.hu&#10;..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
              rows={5}
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? '...' : 'Hozzáadás'}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm rounded-lg transition-colors"
              >
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Participant list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Még nincs résztvevő</p>
          </div>
        ) : (
          participants.map((participant) => (
            <div 
              key={participant.id} 
              className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${participant.is_present ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{participant.name}</p>
                  {participant.email && (
                    <p className="text-sm text-gray-500">{participant.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-mono">
                  {participant.access_code}
                </code>
                <button
                  onClick={() => copyCode(participant.id, participant.access_code)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Kód másolása"
                >
                  {copiedId === participant.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onRegenerateCode(participant.id, generateAccessCode())}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Új kód generálása"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(participant.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
