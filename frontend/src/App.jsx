import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import Overview from './pages/Overview.jsx'
import Cases from './pages/Cases.jsx'
import ChatAssistant from './pages/ChatAssistant.jsx'
import CaseSearch from './pages/CaseSearch.jsx'
import FIRGenerator from './pages/FIRGenerator.jsx'
import CriminalSearch from './pages/CriminalSearch.jsx'
import MissingPersons from './pages/MissingPersons.jsx'
import VehicleSearch from './pages/VehicleSearch.jsx'
import Reports from './pages/Reports.jsx'
import Profile from './pages/Profile.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import CitizenPortal from './pages/CitizenPortal.jsx'
import { UserProvider, useUser } from './contexts/UserContext.jsx'

function RequireAuth({ children }) {
  const { user } = useUser()
  return user?.token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/citizen" element={<CitizenPortal />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="cases" element={<Cases />} />
            <Route path="fir" element={<FIRGenerator />} />
            <Route path="search" element={<CaseSearch />} />
            <Route path="criminals" element={<CriminalSearch />} />
            <Route path="missing-persons" element={<MissingPersons />} />
            <Route path="vehicles" element={<VehicleSearch />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="assistant" element={<ChatAssistant />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}
