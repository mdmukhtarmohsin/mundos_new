import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import LeadsPage from './pages/LeadsPage'
import AgentsPage from './pages/AgentsPage'
import { ApiKeyContext } from './context/ApiKeyContext'
import Topbar from './components/Topbar'

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('X_API_KEY'))
  const value = useMemo(() => ({ apiKey, setApiKey }), [apiKey])

  return (
    <ApiKeyContext.Provider value={value}>
      <Sidebar />
      <Topbar />
      <main className="md:pl-[var(--sidebar-w)] min-h-[calc(100vh-56px)] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </ApiKeyContext.Provider>
  )
}

