import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export default function TopBar() {
  const currentUser = useAppStore(s => s.currentUser)
  const selectedDate = useAppStore(s => s.selectedDate)
  const setSelectedDate = useAppStore(s => s.setSelectedDate)
  const logout = useAppStore(s => s.logout)
  const syncStatus = useAppStore(s => s.syncStatus)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isFuture = selectedDate > today

  const queuedCount = useAppStore(s => s.queuedCount)

  const syncIcon = {
    idle: null,
    syncing: '⟳',
    success: '✓',
    error: '!',
    offline: '⚡',
  }[syncStatus]

  const syncColor = {
    idle: '',
    syncing: 'text-slate-400',
    success: 'text-brand-400',
    error: 'text-red-400',
    offline: 'text-orange-400',
  }[syncStatus]

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 safe-top">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95"
          >
            ‹
          </button>
          <button
            onClick={() => setSelectedDate(today)}
            className="min-w-[6rem] text-center text-sm font-semibold text-slate-100 hover:text-brand-400 transition-colors"
          >
            {formatDate(selectedDate)}
          </button>
          <button
            onClick={() => !isFuture && setSelectedDate(addDays(selectedDate, 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${
              isFuture
                ? 'text-slate-700 cursor-default'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ›
          </button>
        </div>

        {/* Right: sync + user avatar */}
        <div className="flex items-center gap-2">
          {syncIcon && (
            <span className={`text-xs font-bold ${syncColor}`} title={queuedCount > 0 ? `${queuedCount} changes queued` : ''}>
              {syncIcon}{queuedCount > 0 ? <sup className="text-[9px] ml-0.5">{queuedCount}</sup> : null}
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-lg shadow-md active:scale-95 transition-transform"
            >
              {currentUser?.avatar || currentUser?.name?.[0] || '?'}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-11 z-50 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl min-w-[10rem] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-semibold text-slate-100">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentUser?.isAdmin ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span>↩</span> Switch User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
