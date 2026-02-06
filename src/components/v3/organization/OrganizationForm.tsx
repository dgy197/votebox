import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { useOrgStore } from '../../../stores/orgStore'
import { Button, Card, Input } from '../../ui'
import type { OrganizationType, Organization } from '../../../types/v3'

const orgTypes: { value: OrganizationType; label: string; description: string }[] = [
  { value: 'condominium', label: 'Társasház', description: 'Lakóközösség, közös tulajdon' },
  { value: 'company', label: 'Cég', description: 'Részvénytársaság, Kft., egyéb vállalkozás' },
  { value: 'association', label: 'Egyesület', description: 'Civil szervezet, alapítvány' },
  { value: 'cooperative', label: 'Szövetkezet', description: 'Lakásszövetkezet, termelő szövetkezet' },
  { value: 'other', label: 'Egyéb', description: 'Más típusú szervezet' },
]

interface OrganizationFormProps {
  organization?: Organization
  onSuccess?: (org: Organization) => void
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const navigate = useNavigate()
  const { createOrganization, updateOrganization, loading, error, clearError } = useOrgStore()
  
  const [name, setName] = useState(organization?.name || '')
  const [type, setType] = useState<OrganizationType>(organization?.type || 'condominium')
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '')

  const isEdit = !!organization

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!name.trim()) return

    if (isEdit) {
      const success = await updateOrganization(organization.id, {
        name: name.trim(),
        type,
        logo_url: logoUrl.trim() || undefined,
      })
      if (success && onSuccess) {
        onSuccess({ ...organization, name: name.trim(), type, logo_url: logoUrl.trim() || undefined })
      }
    } else {
      const newOrg = await createOrganization({
        name: name.trim(),
        type,
        logo_url: logoUrl.trim() || undefined,
      })
      if (newOrg) {
        if (onSuccess) {
          onSuccess(newOrg)
        } else {
          navigate(`/v3/org/${newOrg.id}`)
        }
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Szervezet szerkesztése' : 'Új szervezet'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEdit ? 'Módosítsd a szervezet adatait' : 'Hozz létre egy új szervezetet'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Szervezet neve *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. Napfény Társasház"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Szervezet típusa *
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {orgTypes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    type === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2
                      className={`w-5 h-5 ${
                        type === option.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          type === option.value
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL (opcionális)
            </label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
            {logoUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-12 h-12 rounded-lg object-cover border dark:border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-sm text-gray-500">Előnézet</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Mentés...' : isEdit ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
