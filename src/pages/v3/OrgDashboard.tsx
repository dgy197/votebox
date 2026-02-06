import { useEffect, useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { Building2, Users, Calendar, Settings, ArrowLeft } from 'lucide-react'
import { useOrgStore } from '../../stores/orgStore'
import { MemberList } from '../../components/v3/member'
import { MeetingList } from '../../components/v3/meeting'
import { Spinner, Badge } from '../../components/ui'

type TabType = 'meetings' | 'members'

const orgTypeLabels = {
  condominium: 'Társasház',
  company: 'Cég',
  association: 'Egyesület',
  cooperative: 'Szövetkezet',
  other: 'Egyéb',
}

export function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const { currentOrg, loading, error, fetchOrganization } = useOrgStore()
  const [activeTab, setActiveTab] = useState<TabType>('meetings')

  useEffect(() => {
    if (orgId) {
      fetchOrganization(orgId)
    }
  }, [orgId, fetchOrganization])

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
        <button
          onClick={() => navigate('/v3')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Vissza a szervezetekhez
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'meetings' as const, label: 'Gyűlések', icon: Calendar },
    { id: 'members' as const, label: 'Tagok', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/v3')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              {currentOrg.logo_url ? (
                <img
                  src={currentOrg.logo_url}
                  alt={currentOrg.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentOrg.name}
              </h1>
              <Badge variant="secondary" size="sm">
                {orgTypeLabels[currentOrg.type]}
              </Badge>
            </div>
          </div>
        </div>
        <NavLink
          to={`/v3/org/${orgId}/settings`}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Settings className="w-5 h-5" />
        </NavLink>
      </div>

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'meetings' && <MeetingList orgId={currentOrg.id} />}
        {activeTab === 'members' && <MemberList orgId={currentOrg.id} />}
      </div>
    </div>
  )
}
