import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import useAppStore from './store/useAppStore.js'
import LoginScreen from './components/LoginScreen.jsx'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import TodayPage from './pages/TodayPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function AppShell() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const currentUser = useAppStore(s => s.currentUser)
  const init = useAppStore(s => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (!currentUser) {
    return <LoginScreen />
  }

  return <AppShell />
}
