import { useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore.js'
import { hashPin } from '../lib/crypto.js'

// ── UserTile ──────────────────────────────────────────────────────────────

function UserTile({ user, onSelect }) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all duration-150 border border-slate-700 hover:border-brand-500"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-3xl shadow-lg">
        {user.avatar || user.name[0]}
      </div>
      <span className="text-sm font-semibold text-slate-200">{user.name}</span>
    </button>
  )
}

// ── PinEntry ──────────────────────────────────────────────────────────────

function PinEntry({ user, onSuccess, onBack }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAppStore(s => s.login)

  const handleDigit = (digit) => {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError('')
    if (next.length === 4) {
      submitPin(next)
    }
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  const submitPin = async (p) => {
    setLoading(true)
    try {
      await login(user.id, p)
      // Navigation handled by App.jsx reacting to currentUser change
    } catch {
      setError('Incorrect PIN. Try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xs mx-auto">
      {/* User avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-4xl shadow-xl">
          {user.avatar || user.name[0]}
        </div>
        <p className="text-lg font-semibold text-slate-100">{user.name}</p>
        <p className="text-sm text-slate-400">Enter your PIN</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length
                ? 'bg-brand-400 scale-110'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm font-medium -mt-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {digits.map((d, i) => (
          <button
            key={i}
            disabled={d === '' || loading}
            onClick={() => {
              if (d === '⌫') handleDelete()
              else if (d !== '') handleDigit(d)
            }}
            className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-150 active:scale-95 ${
              d === ''
                ? 'invisible'
                : d === '⌫'
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {d}
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
      >
        ← Back to users
      </button>
    </div>
  )
}

// ── LoginScreen ───────────────────────────────────────────────────────────

export default function LoginScreen() {
  const users = useAppStore(s => s.users)
  const [selectedUser, setSelectedUser] = useState(null)

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <div className="text-6xl">💪</div>
        <h1 className="text-2xl font-bold text-slate-100">Hugo's Health App</h1>
        <p className="text-slate-400 text-center text-sm max-w-xs">
          No users set up yet. Ask your admin to add users in the Settings.
        </p>
        <SetupAdminButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-12">
      {!selectedUser ? (
        <>
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl mb-2">💪</div>
            <h1 className="text-2xl font-bold text-slate-100">Hugo's Health App</h1>
            <p className="text-slate-400 text-sm">Who's tracking today?</p>
          </div>
          <div className={`grid gap-4 w-full max-w-sm ${users.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {users.map(user => (
              <UserTile key={user.id} user={user} onSelect={setSelectedUser} />
            ))}
          </div>
        </>
      ) : (
        <PinEntry
          user={selectedUser}
          onSuccess={() => {}}
          onBack={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

// ── SetupAdminButton ─────────────────────────────────────────────────────

function SetupAdminButton() {
  const addUser = useAppStore(s => s.addUser)
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || pin.length !== 4) {
      setError('Name is required and PIN must be 4 digits.')
      return
    }
    setLoading(true)
    try {
      await addUser({ name: name.trim(), avatar: '👤', pin, isAdmin: true })
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-brand-400 hover:text-brand-300 text-sm underline"
      >
        Set up first user
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 w-full max-w-xs">
      <h2 className="text-lg font-bold text-center">Create Admin User</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <input
        type="text"
        placeholder="Your name (e.g. Hugo)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
        maxLength={30}
      />
      <input
        type="password"
        placeholder="4-digit PIN"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
        maxLength={4}
        pattern="\d{4}"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-500 hover:bg-brand-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Admin User'}
      </button>
      <button type="button" onClick={() => setShow(false)} className="text-slate-400 text-sm">Cancel</button>
    </form>
  )
}
