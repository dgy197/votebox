import { useState } from 'react'
import { Save } from 'lucide-react'
import { useMemberStore } from '../../../stores/memberStore'
import { Button, Input } from '../../ui'
import type { Member, MemberRole } from '../../../types/v3'

const roles: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: 'Admin - teljes hozzáférés' },
  { value: 'chair', label: 'Elnök - gyűlés vezetése' },
  { value: 'secretary', label: 'Jegyző - jegyzőkönyv' },
  { value: 'voter', label: 'Szavazó - alapértelmezett' },
  { value: 'observer', label: 'Megfigyelő - csak olvasás' },
]

interface MemberFormProps {
  orgId: string
  member?: Member
  onSuccess: () => void
  onCancel: () => void
}

export function MemberForm({ orgId, member, onSuccess, onCancel }: MemberFormProps) {
  const { createMember, updateMember, loading, error, clearError } = useMemberStore()

  const [name, setName] = useState(member?.name || '')
  const [email, setEmail] = useState(member?.email || '')
  const [phone, setPhone] = useState(member?.phone || '')
  const [weight, setWeight] = useState(member?.weight?.toString() || '1')
  const [weightLabel, setWeightLabel] = useState(member?.weight_label || '')
  const [role, setRole] = useState<MemberRole>(member?.role || 'voter')
  const [isActive, setIsActive] = useState(member?.is_active ?? true)

  const isEdit = !!member

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!name.trim()) return

    const weightNum = parseFloat(weight) || 1

    if (isEdit) {
      const success = await updateMember(member.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        weight: weightNum,
        weight_label: weightLabel.trim() || undefined,
        role,
        is_active: isActive,
      })
      if (success) onSuccess()
    } else {
      const newMember = await createMember({
        org_id: orgId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        weight: weightNum,
        weight_label: weightLabel.trim() || undefined,
        role,
      })
      if (newMember) onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Név *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="pl. Kovács János"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kovacs.janos@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon
        </label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+36 20 123 4567"
        />
      </div>

      {/* Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Súly *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="1.00"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Szavazati súly (pl. tulajdoni hányad)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Súly címke
          </label>
          <Input
            value={weightLabel}
            onChange={(e) => setWeightLabel(e.target.value)}
            placeholder="pl. A/1 lakás - 52m²"
          />
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Szerepkör
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active (only for edit) */}
      {isEdit && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
            Aktív tag (szavazhat, részt vehet gyűléseken)
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Mégse
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Mentés...' : isEdit ? 'Mentés' : 'Hozzáadás'}
        </Button>
      </div>
    </form>
  )
}
