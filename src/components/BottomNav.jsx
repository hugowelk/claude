import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/today', label: 'Today', icon: '📋' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-bottom">
      <div className="flex h-16">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                active ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
