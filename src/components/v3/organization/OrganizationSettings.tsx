import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'
import { useOrgStore } from '../../../stores/orgStore'
import { Button, Card, Spinner, Modal } from '../../ui'
import { OrganizationForm } from './OrganizationForm'

export function OrganizationSettings() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const { currentOrg, loading, error, fetchOrganization, deleteOrganization } = useOrgStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (orgId) {
      fetchOrganization(orgId)
    }
  }, [orgId, fetchOrganization])

  const handleDelete = async () => {
    if (!currentOrg) return
    
    setDeleting(true)
    const success = await deleteOrganization(currentOrg.id)
    setDeleting(false)
    
    if (success) {
      navigate('/v3')
    }
  }

  if (loading && !currentOrg) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !currentOrg) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Szervezet nem található'}</p>
        <Button onClick={() => navigate('/v3')} className="mt-4">
          Vissza
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/v3/org/${orgId}`)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Beállítások
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{currentOrg.name}</p>
        </div>
      </div>

      {/* Edit Form */}
      <OrganizationForm
        organization={currentOrg}
        onSuccess={() => navigate(`/v3/org/${orgId}`)}
      />

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Veszélyes zóna
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          A szervezet törlése végleges. Minden kapcsolódó adat (tagok, gyűlések, szavazások) 
          törlődni fog.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Szervezet törlése
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Szervezet törlése"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Biztosan törölni szeretnéd a(z) "{currentOrg.name}" szervezetet?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Ez a művelet nem visszavonható!
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Mégse
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Törlés...' : 'Igen, törlöm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
