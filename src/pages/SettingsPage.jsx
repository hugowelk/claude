import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import { defaultSettings } from '../store/useAppStore.js'

// ── Section wrapper ───────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-slate-700/50">{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-slate-200">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────

const AVATARS = ['👤','😀','💪','🏋️','🧠','⚡','🔥','🌟','🎯','🦁','🐯','🦊','🐺','🦋','🌊']

function ProfileSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const changePin = useAppStore(s => s.changePin)
  const [name, setName] = useState(currentUser?.name || '')
  const [showPinChange, setShowPinChange] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [showAvatars, setShowAvatars] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveName = async () => {
    if (!name.trim()) return
    await updateUser(currentUser.id, { name: name.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePinChange = async () => {
    if (newPin.length !== 4) { setPinError('PIN must be 4 digits'); return }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return }
    await changePin(currentUser.id, newPin)
    setShowPinChange(false)
    setNewPin('')
    setConfirmPin('')
    setPinError('')
  }

  return (
    <Section title="My Profile">
      <div className="p-4 flex flex-col items-center gap-3">
        <button
          onClick={() => setShowAvatars(!showAvatars)}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-4xl shadow-lg active:scale-95 transition-transform"
        >
          {currentUser?.avatar || '👤'}
        </button>
        {showAvatars && (
          <div className="grid grid-cols-5 gap-2 w-full">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { updateUser(currentUser.id, { avatar: a }); setShowAvatars(false) }}
                className="h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-2xl flex items-center justify-center active:scale-95 transition-transform"
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
      <Row label="Name">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={saveName}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 w-36"
          maxLength={30}
        />
        {saved && <span className="text-xs text-brand-400">Saved</span>}
      </Row>
      <div className="px-4 py-3">
        {!showPinChange ? (
          <button
            onClick={() => setShowPinChange(true)}
            className="text-sm text-brand-400 hover:text-brand-300 font-medium"
          >
            Change PIN
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">Change PIN</p>
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            <input
              type="password"
              inputMode="numeric"
              placeholder="New 4-digit PIN"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <input
              type="password"
              inputMode="numeric"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePinChange}
                className="flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                Save PIN
              </button>
              <button
                onClick={() => { setShowPinChange(false); setNewPin(''); setConfirmPin(''); setPinError('') }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Nutrition targets ────────────────────────────────────────────────────

function NutritionSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const [calories, setCalories] = useState(settings.calorieTarget || 2500)
  const [protein, setProtein] = useState(settings.proteinTarget || 180)

  const save = async () => {
    await updateUser(currentUser.id, {
      settings: { ...settings, calorieTarget: Number(calories), proteinTarget: Number(protein) }
    })
  }

  return (
    <Section title="Nutrition Targets">
      <Row label="Daily Calories">
        <input
          type="number"
          value={calories}
          onChange={e => setCalories(e.target.value)}
          onBlur={save}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 w-24 text-right"
          min="500" max="10000"
        />
        <span className="text-xs text-slate-400">kcal</span>
      </Row>
      <Row label="Daily Protein">
        <input
          type="number"
          value={protein}
          onChange={e => setProtein(e.target.value)}
          onBlur={save}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 w-24 text-right"
          min="0" max="500"
        />
        <span className="text-xs text-slate-400">g</span>
      </Row>
    </Section>
  )
}

// ── Units ────────────────────────────────────────────────────────────────

function UnitsSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()

  const toggle = async () => {
    const next = settings.weightUnit === 'kg' ? 'lbs' : 'kg'
    await updateUser(currentUser.id, { settings: { ...settings, weightUnit: next } })
  }

  return (
    <Section title="Units">
      <Row label="Weight Unit">
        <button
          onClick={toggle}
          className="flex items-center bg-slate-700 border border-slate-600 rounded-lg overflow-hidden text-sm"
        >
          <span className={`px-3 py-1.5 ${settings.weightUnit === 'kg' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>kg</span>
          <span className={`px-3 py-1.5 ${settings.weightUnit === 'lbs' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>lbs</span>
        </button>
      </Row>
    </Section>
  )
}

// ── Supplements/Medications ──────────────────────────────────────────────

function ItemListSection({ title, settingsKey, icon }) {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const items = settings[settingsKey] || []
  const [newName, setNewName] = useState('')
  const [newDose, setNewDose] = useState('')

  const save = async (newItems) => {
    await updateUser(currentUser.id, {
      settings: { ...settings, [settingsKey]: newItems }
    })
  }

  const addItem = async () => {
    if (!newName.trim()) return
    const item = { id: crypto.randomUUID(), name: newName.trim(), dose: newDose.trim() }
    const updated = [...items, item]
    await save(updated)
    setNewName('')
    setNewDose('')
  }

  const removeItem = async (id) => {
    await save(items.filter(i => i.id !== id))
  }

  return (
    <Section title={`${icon} ${title}`}>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-100">{item.name}</p>
            {item.dose && <p className="text-xs text-slate-400">{item.dose}</p>}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={`${title} name`}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={newDose}
            onChange={e => setNewDose(e.target.value)}
            placeholder="Dose"
            className="w-20 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={addItem}
          disabled={!newName.trim()}
          className="w-full py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
        >
          + Add {title.toLowerCase()}
        </button>
      </div>
    </Section>
  )
}

// ── Notion Config ─────────────────────────────────────────────────────────

function NotionSection() {
  const notionApiKey = useAppStore(s => s.notionApiKey)
  const notionUsersDbId = useAppStore(s => s.notionUsersDbId)
  const notionLogsDbId = useAppStore(s => s.notionLogsDbId)
  const saveNotionConfig = useAppStore(s => s.saveNotionConfig)
  const syncStatus = useAppStore(s => s.syncStatus)
  const lastSyncedAt = useAppStore(s => s.lastSyncedAt)

  const [apiKey, setApiKey] = useState(notionApiKey || '')
  const [usersDbId, setUsersDbId] = useState(notionUsersDbId || '')
  const [logsDbId, setLogsDbId] = useState(notionLogsDbId || '')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await saveNotionConfig({ apiKey, usersDbId, logsDbId })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const syncColor = {
    idle: 'text-slate-400',
    syncing: 'text-yellow-400',
    success: 'text-brand-400',
    error: 'text-red-400',
  }[syncStatus]

  const syncLabel = {
    idle: 'Not synced',
    syncing: 'Syncing...',
    success: lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Synced',
    error: 'Sync failed',
  }[syncStatus]

  return (
    <Section title="🔗 Notion Integration">
      <div className="p-4 space-y-3">
        <p className={`text-xs font-medium ${syncColor}`}>{syncLabel}</p>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Notion API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="secret_..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Users Database ID</label>
          <input
            type="text"
            value={usersDbId}
            onChange={e => setUsersDbId(e.target.value)}
            placeholder="Database ID"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Daily Logs Database ID</label>
          <input
            type="text"
            value={logsDbId}
            onChange={e => setLogsDbId(e.target.value)}
            placeholder="Database ID"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={save}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Notion Config'}
        </button>
        <p className="text-xs text-slate-500">
          Data syncs automatically when you save entries. Notion API calls require CORS-permissive proxy in production.
        </p>
      </div>
    </Section>
  )
}

// ── Manage Users ──────────────────────────────────────────────────────────

function ManageUsersSection() {
  const users = useAppStore(s => s.users)
  const currentUser = useAppStore(s => s.currentUser)
  const addUser = useAppStore(s => s.addUser)
  const removeUser = useAppStore(s => s.removeUser)
  const changePin = useAppStore(s => s.changePin)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newAvatar, setNewAvatar] = useState('👤')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!newName.trim() || newPin.length !== 4) {
      setError('Name required and PIN must be 4 digits')
      return
    }
    setAdding(true)
    try {
      await addUser({ name: newName.trim(), avatar: newAvatar, pin: newPin })
      setShowAdd(false)
      setNewName('')
      setNewPin('')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId) => {
    if (userId === currentUser.id) return
    if (!confirm('Remove this user? This cannot be undone.')) return
    await removeUser(userId)
  }

  return (
    <Section title="👥 Manage Users">
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-3 px-4 py-3">
          <span className="text-2xl">{user.avatar || '👤'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-400">{user.isAdmin ? 'Admin' : 'Member'}</p>
          </div>
          {user.id !== currentUser.id && (
            <button
              onClick={() => handleRemove(user.id)}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {!showAdd ? (
        <div className="p-4">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
          >
            + Add User
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Display name"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add User'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError('') }}
              className="px-4 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

// ── SettingsPage ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const currentUser = useAppStore(s => s.currentUser)

  return (
    <div className="px-4 py-4 pb-safe space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Settings</h1>

      <ProfileSection />
      <NutritionSection />
      <UnitsSection />
      <ItemListSection title="Supplements" settingsKey="supplements" icon="💊" />
      <ItemListSection title="Medications" settingsKey="medications" icon="💉" />
      <NotionSection />

      {currentUser?.isAdmin && <ManageUsersSection />}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-600">Hugo's Health App · v1.0.0</p>
      </div>
    </div>
  )
}
