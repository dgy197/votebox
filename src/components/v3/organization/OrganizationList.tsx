import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Users, Settings } from 'lucide-react'
import { useOrgStore } from '../../../stores/orgStore'
import { Button, Card, Spinner, Badge } from '../../ui'
import type { Organization, OrganizationType } from '../../../types/v3'

const orgTypeLabels: Record<OrganizationType, string> = {
  condominium: 'Társasház',
  company: 'Cég',
  association: 'Egyesület',
  cooperative: 'Szövetkezet',
  other: 'Egyéb',
}

const orgTypeColors: Record<OrganizationType, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  condominium: 'primary',
  company: 'success',
  association: 'warning',
  cooperative: 'secondary',
  other: 'secondary',
}

interface OrganizationCardProps {
  org: Organization
  onSelect: (org: Organization) => void
  onSettings: (org: Organization) => void
}

function OrganizationCard({ org, onSelect, onSettings }: OrganizationCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4" onClick={() => onSelect(org)}>
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {org.name}
            </h3>
            <Badge variant={orgTypeColors[org.type]} size="sm">
              {orgTypeLabels[org.type]}
            </Badge>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSettings(org)
          }}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Tagok</span>
        </div>
        <span>•</span>
        <span>Létrehozva: {new Date(org.created_at).toLocaleDateString('hu-HU')}</span>
      </div>
    </Card>
  )
}

export function OrganizationList() {
  const navigate = useNavigate()
  const { organizations, loading, error, fetchOrganizations, setCurrentOrg } = useOrgStore()

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const handleSelect = (org: Organization) => {
    setCurrentOrg(org)
    navigate(`/v3/org/${org.id}`)
  }

  const handleSettings = (org: Organization) => {
    setCurrentOrg(org)
    navigate(`/v3/org/${org.id}/settings`)
  }

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={() => fetchOrganizations()} className="mt-4">
          Újra
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Szervezetek</h1>
          <p className="text-gray-500 dark:text-gray-400">Válassz egy szervezetet vagy hozz létre újat</p>
        </div>
        <Button onClick={() => navigate('/v3/org/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Új szervezet
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Még nincs szervezeted
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Hozz létre egy szervezetet a kezdéshez
          </p>
          <Button onClick={() => navigate('/v3/org/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Új szervezet létrehozása
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              onSelect={handleSelect}
              onSettings={handleSettings}
            />
          ))}
        </div>
      )}
    </div>
  )
}
