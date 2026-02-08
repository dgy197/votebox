import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './lib/i18n'

// Pages
import { HomePage } from './pages/HomePage'
import { AdminLogin } from './pages/auth/AdminLogin'
import { VoterLogin } from './pages/auth/VoterLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { VoterDashboard } from './pages/voter/VoterDashboard'
import SuperAdminDashboard from './pages/super/SuperAdminDashboard'
import { V3Dashboard } from './pages/v3/V3Dashboard'
import { ScheduleMeeting } from './pages/ScheduleMeeting'

// Components
import { Layout } from './components/layout/Layout'

// Stores
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAdmin, isVoter, isSuperAdmin } = useAuthStore()
  
  return (
    <BrowserRouter>
      <Routes>
        {/* HomePage - full page layout, no wrapper */}
        <Route path="/" element={<HomePage />} />
        
        {/* VoteBox 3.0 routes */}
        <Route path="/v3/*" element={<V3Dashboard />} />
        
        {/* Schedule meeting (Doodle-style) */}
        <Route path="/schedule/:meetingId" element={<ScheduleMeeting />} />
        
        {/* Auth pages - full page layout, no wrapper */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/vote/:eventCode" element={<VoterLogin />} />
        <Route path="/vote" element={<VoterLogin />} />
        
        {/* Super Admin routes - has own layout */}
        <Route 
          path="/super/*" 
          element={isSuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/admin/login" />} 
        />
        
        {/* Admin routes - needs Layout */}
        <Route 
          path="/admin/*" 
          element={isAdmin ? <Layout><AdminDashboard /></Layout> : <Navigate to="/admin/login" />} 
        />
        
        {/* Voter routes - has own layout */}
        <Route 
          path="/voting/*" 
          element={isVoter ? <VoterDashboard /> : <Navigate to="/" />} 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
