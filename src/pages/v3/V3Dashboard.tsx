import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { OrganizationList, OrganizationForm, OrganizationSettings } from '../../components/v3/organization'
import { OrgDashboard } from './OrgDashboard'
import { MeetingDetail } from '../MeetingDetail'

export function V3Dashboard() {
  return (
    <Layout>
      <Routes>
        {/* Organization routes */}
        <Route path="/" element={<OrganizationList />} />
        <Route path="/org/new" element={<OrganizationForm />} />
        <Route path="/org/:orgId" element={<OrgDashboard />} />
        <Route path="/org/:orgId/settings" element={<OrganizationSettings />} />
        <Route path="/org/:orgId/meeting/new" element={<MeetingNewPage />} />
        <Route path="/org/:orgId/meeting/:meetingId" element={<MeetingDetail />} />
        
        {/* Direct meeting route */}
        <Route path="/meetings/:meetingId" element={<MeetingDetailWrapper />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/v3" replace />} />
      </Routes>
    </Layout>
  )
}

function MeetingDetailWrapper() {
  // Wrapper for /meetings/:id route without orgId in URL
  return <MeetingDetail />
}

function MeetingNewPage() {
  const { orgId } = useParams<{ orgId: string }>()
  if (!orgId) return <Navigate to="/v3" replace />
  
  // Import dynamically to avoid circular deps
  const { MeetingWizard } = require('../../components/v3/meeting')
  return <MeetingWizard orgId={orgId} />
}
