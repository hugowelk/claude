import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import { defaultSettings } from '../store/useAppStore.js'
import { searchExercises } from '../data/exercises.js'

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
    setNewPin(''); setConfirmPin(''); setPinError('')
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
          <button onClick={() => setShowPinChange(true)} className="text-sm text-brand-400 hover:text-brand-300 font-medium">
            Change PIN
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">Change PIN</p>
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            <input type="password" inputMode="numeric" placeholder="New 4-digit PIN"
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <input type="password" inputMode="numeric" placeholder="Confirm PIN"
              value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <button onClick={handlePinChange} className="flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                Save PIN
              </button>
              <button onClick={() => { setShowPinChange(false); setNewPin(''); setConfirmPin(''); setPinError('') }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Nutrition targets ─────────────────────────────────────────────────────

function NutritionSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const [calories, setCalories] = useState(settings.calorieTarget || 2500)
  const [protein, setProtein] = useState(settings.proteinTarget || 180)
  const [water, setWater] = useState(settings.waterTarget || 2500)

  const save = async () => {
    await updateUser(currentUser.id, {
      settings: {
        ...settings,
        calorieTarget: Number(calories),
        proteinTarget: Number(protein),
        waterTarget: Number(water),
      }
    })
  }

  const field = (value, setter, unit, min, max) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={e => setter(e.target.value)}
        onBlur={save}
        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 w-24 text-right"
        min={min} max={max}
      />
      <span className="text-xs text-slate-400">{unit}</span>
    </div>
  )

  return (
    <Section title="Nutrition Targets">
      <Row label="Daily Calories">{field(calories, setCalories, 'kcal', 500, 10000)}</Row>
      <Row label="Daily Protein">{field(protein, setProtein, 'g', 0, 500)}</Row>
      <Row label="Daily Water">{field(water, setWater, 'ml', 0, 10000)}</Row>
    </Section>
  )
}

// ── Units ─────────────────────────────────────────────────────────────────

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
        <button onClick={toggle} className="flex items-center bg-slate-700 border border-slate-600 rounded-lg overflow-hidden text-sm">
          <span className={`px-3 py-1.5 ${settings.weightUnit === 'kg' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>kg</span>
          <span className={`px-3 py-1.5 ${settings.weightUnit === 'lbs' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>lbs</span>
        </button>
      </Row>
    </Section>
  )
}

// ── Card order / template editor ──────────────────────────────────────────

const ALL_CARDS = [
  { key: 'breakfast',          label: 'Breakfast',            icon: '🌅' },
  { key: 'morningSupplements', label: 'Morning Supplements',  icon: '💊' },
  { key: 'lunch',              label: 'Lunch',                icon: '☀️' },
  { key: 'dinner',             label: 'Dinner',               icon: '🌙' },
  { key: 'snacks',             label: 'Snacks',               icon: '🍎' },
  { key: 'workout',            label: 'Workout',              icon: '🏋️' },
  { key: 'medications',        label: 'Medications',          icon: '💉' },
  { key: 'water',              label: 'Water',                icon: '💧' },
]

function CardOrderSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const cardOrder = settings.cardOrder || ALL_CARDS.map(c => c.key)

  const saveOrder = async (newOrder) => {
    await updateUser(currentUser.id, { settings: { ...settings, cardOrder: newOrder } })
  }

  const move = (index, direction) => {
    const next = [...cardOrder]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    saveOrder(next)
  }

  const toggle = (key) => {
    const has = cardOrder.includes(key)
    const next = has
      ? cardOrder.filter(k => k !== key)
      : [...cardOrder, key]
    saveOrder(next)
  }

  // Cards not currently in order
  const inactive = ALL_CARDS.filter(c => !cardOrder.includes(c.key))

  return (
    <Section title="📋 Daily Card Order">
      <div className="p-3 space-y-1">
        {cardOrder.map((key, i) => {
          const card = ALL_CARDS.find(c => c.key === key)
          if (!card) return null
          return (
            <div key={key} className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-2.5">
              <span className="text-lg w-7 text-center">{card.icon}</span>
              <span className="flex-1 text-sm text-slate-100">{card.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors text-sm"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === cardOrder.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors text-sm"
                >
                  ▼
                </button>
                <button
                  onClick={() => toggle(key)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}

        {inactive.length > 0 && (
          <div className="pt-2 space-y-1">
            <p className="text-xs text-slate-500 px-1 pb-1">Hidden cards</p>
            {inactive.map(card => (
              <div key={card.key} className="flex items-center gap-2 bg-slate-700/20 border border-dashed border-slate-600 rounded-xl px-3 py-2.5">
                <span className="text-lg w-7 text-center opacity-50">{card.icon}</span>
                <span className="flex-1 text-sm text-slate-500">{card.label}</span>
                <button
                  onClick={() => toggle(card.key)}
                  className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Workout preset editor ─────────────────────────────────────────────────

function ExerciseEditor({ exercises, onChange, weightUnit }) {
  const [suggestions, setSuggestions] = useState([])
  const [focusedIdx, setFocusedIdx] = useState(null)

  const updateEx = (i, updates) => {
    onChange(exercises.map((e, idx) => idx === i ? { ...e, ...updates } : e))
  }
  const removeEx = (i) => onChange(exercises.filter((_, idx) => idx !== i))
  const addEx = () => onChange([...exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: 10, weight: 0 }])

  return (
    <div className="space-y-2">
      {exercises.map((ex, i) => (
        <div key={ex.id || i} className="bg-slate-700/50 rounded-xl p-3 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={ex.name}
              onChange={e => { updateEx(i, { name: e.target.value }); setSuggestions(searchExercises(e.target.value)); setFocusedIdx(i) }}
              onBlur={() => setTimeout(() => setFocusedIdx(null), 150)}
              placeholder="Exercise name"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            {focusedIdx === i && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-xl mt-1 overflow-hidden shadow-xl">
                {suggestions.map((s, si) => (
                  <button key={si} onMouseDown={() => { updateEx(i, { name: s }); setSuggestions([]) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-slate-700">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: 'sets', label: 'Sets', max: 20 },
              { key: 'reps', label: 'Reps', max: 100 },
              { key: 'weight', label: `Wt (${weightUnit})`, max: 999 },
            ].map(({ key, label, max }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500 block mb-0.5">{label}</label>
                <input type="number" value={ex[key]}
                  onChange={e => updateEx(i, { [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  min="0" max={max}
                />
              </div>
            ))}
            <div className="flex items-end">
              <button onClick={() => removeEx(i)}
                className="w-full py-1.5 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded-lg transition-colors text-xs">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addEx}
        className="w-full py-2 border border-dashed border-slate-600 rounded-xl text-xs text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
        + Add exercise
      </button>
    </div>
  )
}

function WorkoutPresetsSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const presets = settings.workoutPresets || []
  const weightUnit = settings.weightUnit || 'kg'
  const [expanded, setExpanded] = useState(null)
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)

  const savePresets = async (updated) => {
    await updateUser(currentUser.id, { settings: { ...settings, workoutPresets: updated } })
  }

  const addPreset = async () => {
    if (!newName.trim()) return
    const preset = { name: newName.trim(), exercises: [] }
    const updated = [...presets, preset]
    await savePresets(updated)
    setNewName('')
    setShowNew(false)
    setExpanded(updated.length - 1)
  }

  const removePreset = async (i) => {
    if (!confirm(`Remove preset "${presets[i].name}"?`)) return
    await savePresets(presets.filter((_, idx) => idx !== i))
    if (expanded === i) setExpanded(null)
  }

  const updatePreset = async (i, updates) => {
    await savePresets(presets.map((p, idx) => idx === i ? { ...p, ...updates } : p))
  }

  return (
    <Section title="🏋️ Workout Presets">
      <div className="p-3 space-y-2">
        {presets.map((preset, i) => (
          <div key={i} className="bg-slate-700/40 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-3">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="flex-1 text-sm font-medium text-slate-100">{preset.name}</span>
                <span className="text-xs text-slate-400">{preset.exercises?.length || 0} ex</span>
                <span className={`text-slate-500 text-xs transition-transform ${expanded === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              <button
                onClick={() => removePreset(i)}
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {expanded === i && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preset name</label>
                  <input
                    type="text"
                    value={preset.name}
                    onChange={e => updatePreset(i, { name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <ExerciseEditor
                  exercises={preset.exercises || []}
                  weightUnit={weightUnit}
                  onChange={exs => updatePreset(i, { exercises: exs })}
                />
              </div>
            )}
          </div>
        ))}

        {!showNew ? (
          <button
            onClick={() => setShowNew(true)}
            className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
          >
            + New Preset
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPreset()}
              placeholder="Preset name (e.g. Push Day)"
              autoFocus
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            <button onClick={addPreset}
              className="px-4 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors">
              Add
            </button>
            <button onClick={() => { setShowNew(false); setNewName('') }}
              className="px-3 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors text-sm">
              ✕
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Supplement / Medication items ─────────────────────────────────────────

function ItemListSection({ title, settingsKey, icon }) {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const items = settings[settingsKey] || []
  const [newName, setNewName] = useState('')
  const [newDose, setNewDose] = useState('')

  const save = async (newItems) => {
    await updateUser(currentUser.id, { settings: { ...settings, [settingsKey]: newItems } })
  }

  const addItem = async () => {
    if (!newName.trim()) return
    await save([...items, { id: crypto.randomUUID(), name: newName.trim(), dose: newDose.trim() }])
    setNewName(''); setNewDose('')
  }

  return (
    <Section title={`${icon} ${title}`}>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-100">{item.name}</p>
            {item.dose && <p className="text-xs text-slate-400">{item.dose}</p>}
          </div>
          <button onClick={() => save(items.filter(i => i.id !== item.id))}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors">
            ✕
          </button>
        </div>
      ))}
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={`${title} name`}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <input type="text" value={newDose} onChange={e => setNewDose(e.target.value)}
            placeholder="Dose"
            className="w-20 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={addItem} disabled={!newName.trim()}
          className="w-full py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40">
          + Add {title.toLowerCase()}
        </button>
      </div>
    </Section>
  )
}

// ── Meal Presets ──────────────────────────────────────────────────────────

const MEAL_PRESET_META = {
  breakfast: { label: 'Breakfast', icon: '🌅' },
  lunch: { label: 'Lunch', icon: '☀️' },
  dinner: { label: 'Dinner', icon: '🌙' },
  snacks: { label: 'Snacks', icon: '🍎' },
}

function MealPresetsSection() {
  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const settings = currentUser?.settings || defaultSettings()
  const mealPresets = settings.mealPresets || {}

  const savePresets = async (updated) => {
    await updateUser(currentUser.id, { settings: { ...settings, mealPresets: updated } })
  }

  const deletePreset = (mealType, i) => {
    if (!confirm(`Remove preset "${mealPresets[mealType][i].name}"?`)) return
    savePresets({ ...mealPresets, [mealType]: mealPresets[mealType].filter((_, idx) => idx !== i) })
  }

  const renamePreset = (mealType, i, name) => {
    savePresets({ ...mealPresets, [mealType]: mealPresets[mealType].map((p, idx) => idx === i ? { ...p, name } : p) })
  }

  const allEmpty = Object.values(mealPresets).every(arr => !arr?.length)

  return (
    <Section title="🍽️ Meal Presets">
      {allEmpty ? (
        <div className="px-4 py-3">
          <p className="text-sm text-slate-400">No meal presets yet.</p>
          <p className="text-xs text-slate-500 mt-1">Open a meal card, fill it in, then tap "+ Save as preset".</p>
        </div>
      ) : (
        Object.entries(MEAL_PRESET_META).map(([mealType, { label, icon }]) => {
          const presets = mealPresets[mealType] || []
          if (!presets.length) return null
          return (
            <div key={mealType} className="px-4 py-3 space-y-2 border-b border-slate-700/50 last:border-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{icon} {label}</p>
              {presets.map((preset, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2.5">
                  <input
                    type="text"
                    value={preset.name}
                    onChange={e => renamePreset(mealType, i, e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none min-w-0"
                  />
                  <span className="text-xs text-slate-500 shrink-0">{preset.items?.length} item{preset.items?.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => deletePreset(mealType, i)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )
        })
      )}
      {!allEmpty && (
        <div className="px-4 py-2">
          <p className="text-xs text-slate-500">Rename presets inline. Create new ones from a meal card.</p>
        </div>
      )}
    </Section>
  )
}

// ── AI Config ─────────────────────────────────────────────────────────────

function AISection() {
  const claudeApiKey = useAppStore(s => s.claudeApiKey)
  const saveClaudeApiKey = useAppStore(s => s.saveClaudeApiKey)
  const [apiKey, setApiKey] = useState(claudeApiKey || '')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await saveClaudeApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="🤖 AI Settings">
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Claude API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={save}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors">
          {saved ? '✓ Saved' : 'Save AI Config'}
        </button>
        <p className="text-xs text-slate-500">Used to analyze meals from free-text descriptions.</p>
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
  const drainSyncQueue = useAppStore(s => s.drainSyncQueue)
  const pullUsers = useAppStore(s => s.pullUsersFromNotion)
  const syncStatus = useAppStore(s => s.syncStatus)
  const lastSyncedAt = useAppStore(s => s.lastSyncedAt)
  const queuedCount = useAppStore(s => s.queuedCount)

  const [apiKey, setApiKey] = useState(notionApiKey || '')
  const [usersDbId, setUsersDbId] = useState(notionUsersDbId || '')
  const [logsDbId, setLogsDbId] = useState(notionLogsDbId || '')
  const [saved, setSaved] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pullResult, setPullResult] = useState('')

  const save = async () => {
    await saveNotionConfig({ apiKey, usersDbId, logsDbId })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePullUsers = async () => {
    setPulling(true); setPullResult('')
    try {
      const count = await pullUsers()
      setPullResult(`✓ Pulled ${count} user${count !== 1 ? 's' : ''}`)
    } catch (err) {
      setPullResult(`✕ ${err.message}`)
    } finally {
      setPulling(false)
    }
  }

  const syncColor = {
    idle: 'text-slate-400', syncing: 'text-yellow-400',
    success: 'text-brand-400', error: 'text-red-400', offline: 'text-orange-400'
  }[syncStatus] || 'text-slate-400'

  const syncLabel = {
    idle: 'Not synced',
    syncing: 'Syncing…',
    success: lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Synced',
    error: `Sync failed${queuedCount > 0 ? ` (${queuedCount} queued)` : ''}`,
    offline: `Offline — ${queuedCount} change${queuedCount !== 1 ? 's' : ''} queued`,
  }[syncStatus] || ''

  return (
    <Section title="🔗 Notion Integration">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${syncColor}`}>{syncLabel}</p>
          {queuedCount > 0 && (
            <button onClick={drainSyncQueue}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              Sync now
            </button>
          )}
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Notion API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="secret_..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Users Database ID</label>
          <input type="text" value={usersDbId} onChange={e => setUsersDbId(e.target.value)}
            placeholder="Database ID"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Daily Logs Database ID</label>
          <input type="text" value={logsDbId} onChange={e => setLogsDbId(e.target.value)}
            placeholder="Database ID"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={save}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors">
          {saved ? '✓ Saved' : 'Save Notion Config'}
        </button>
        {notionApiKey && notionUsersDbId && (
          <div className="flex items-center gap-2">
            <button onClick={handlePullUsers} disabled={pulling}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
              {pulling ? 'Pulling…' : '⬇ Pull users from Notion'}
            </button>
            {pullResult && <span className={`text-xs ${pullResult.startsWith('✓') ? 'text-brand-400' : 'text-red-400'}`}>{pullResult}</span>}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Data syncs on every save. Offline changes are queued and uploaded when you reconnect.
        </p>
      </div>
    </Section>
  )
}

// ── Manage Users ──────────────────────────────────────────────────────────

const AVATAR_LIST = ['👤','😀','💪','🏋️','⚡','🔥','🌟','🎯','🦁']

function ManageUsersSection() {
  const users = useAppStore(s => s.users)
  const currentUser = useAppStore(s => s.currentUser)
  const addUser = useAppStore(s => s.addUser)
  const removeUser = useAppStore(s => s.removeUser)
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
      setShowAdd(false); setNewName(''); setNewPin(''); setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
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
              onClick={async () => {
                if (!confirm(`Remove ${user.name}? This cannot be undone.`)) return
                await removeUser(user.id)
              }}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {!showAdd ? (
        <div className="p-4">
          <button onClick={() => setShowAdd(true)}
            className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
            + Add User
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {/* Avatar picker */}
          <div className="flex gap-1.5 flex-wrap">
            {AVATAR_LIST.map(a => (
              <button key={a} onClick={() => setNewAvatar(a)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newAvatar === a ? 'bg-brand-500/30 ring-2 ring-brand-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                {a}
              </button>
            ))}
          </div>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Display name"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <input type="password" inputMode="numeric" value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding}
              className="flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {adding ? 'Adding…' : 'Add User'}
            </button>
            <button onClick={() => { setShowAdd(false); setError('') }}
              className="px-4 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors text-sm">
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
      <CardOrderSection />
      <WorkoutPresetsSection />
      <MealPresetsSection />
      <ItemListSection title="Supplements" settingsKey="supplements" icon="💊" />
      <ItemListSection title="Medications" settingsKey="medications" icon="💉" />
      <AISection />
      <NotionSection />

      {currentUser?.isAdmin && <ManageUsersSection />}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-600">Hugo's Health App · v1.0.0</p>
      </div>
    </div>
  )
}
