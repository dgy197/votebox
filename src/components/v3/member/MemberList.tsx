import { useEffect, useState } from 'react'
import { Users, Plus, Upload, Search, MoreHorizontal, Edit2, Trash2, Scale } from 'lucide-react'
import { useMemberStore } from '../../../stores/memberStore'
import { Button, Card, Input, Spinner, Badge, Modal } from '../../ui'
import { MemberForm } from './MemberForm'
import { CSVImportModal } from './CSVImportModal'
import type { Member, MemberRole } from '../../../types/v3'

const roleLabels: Record<MemberRole, string> = {
  admin: 'Admin',
  chair: 'Elnök',
  secretary: 'Jegyző',
  voter: 'Szavazó',
  observer: 'Megfigyelő',
}

const roleColors: Record<MemberRole, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  admin: 'danger',
  chair: 'primary',
  secretary: 'warning',
  voter: 'secondary',
  observer: 'secondary',
}

interface MemberListProps {
  orgId: string
}

interface MemberRowProps {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
}

function MemberRow({ member, onEdit, onDelete }: MemberRowProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
            {member.email && (
              <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={roleColors[member.role]} size="sm">
          {roleLabels[member.role]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm text-gray-900 dark:text-white">
            {member.weight.toFixed(2)}
          </span>
          {member.weight_label && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({member.weight_label})
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            member.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {member.is_active ? 'Aktív' : 'Inaktív'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onEdit(member)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Szerkesztés
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onDelete(member)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Törlés
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export function MemberList({ orgId }: MemberListProps) {
  const { members, loading, error, fetchMembers, deleteMember } = useMemberStore()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)

  useEffect(() => {
    fetchMembers(orgId)
  }, [orgId, fetchMembers])

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalWeight = members.reduce((sum, m) => sum + (m.is_active ? m.weight : 0), 0)

  const handleDelete = async () => {
    if (!deletingMember) return
    await deleteMember(deletingMember.id)
    setDeletingMember(null)
  }

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tagok</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {members.length} tag • Összsúly: {totalWeight.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            CSV Import
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Új tag
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név vagy email alapján..."
          className="pl-10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      {filteredMembers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {search ? 'Nincs találat' : 'Még nincsenek tagok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search ? 'Próbálj más keresési feltételt' : 'Adj hozzá tagokat vagy importálj CSV-ből'}
          </p>
          {!search && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                CSV Import
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Új tag
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Név
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Szerepkör
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Súly
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Státusz
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onEdit={setEditingMember}
                    onDelete={setDeletingMember}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingMember}
        onClose={() => {
          setShowAddModal(false)
          setEditingMember(null)
        }}
        title={editingMember ? 'Tag szerkesztése' : 'Új tag'}
      >
        <MemberForm
          orgId={orgId}
          member={editingMember || undefined}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingMember(null)
          }}
          onCancel={() => {
            setShowAddModal(false)
            setEditingMember(null)
          }}
        />
      </Modal>

      {/* Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        orgId={orgId}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        title="Tag törlése"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Biztosan törölni szeretnéd <strong>{deletingMember?.name}</strong> tagot?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingMember(null)}>
              Mégse
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Törlés
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
