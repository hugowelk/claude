import { useState } from 'react'
import { analyzeMeal } from '../../lib/ai.js'
import useAppStore from '../../store/useAppStore.js'

// ── MealInput ──────────────────────────────────────────────────────────────

function MealInput({ onAdd, apiKey }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!text.trim()) return
    if (!apiKey) { setError('Add a Claude API key in Settings → AI Settings'); return }
    setLoading(true); setError('')
    try {
      const { calories, protein } = await analyzeMeal(text.trim(), apiKey)
      onAdd({ name: text.trim(), protein: Math.round(protein * 10) / 10, calories: Math.round(calories) })
      setText('')
    } catch (err) {
      setError(err.message || 'Could not analyze meal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="e.g. 4 eggs, granola, berries and yogurt"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="px-4 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          {loading ? '…' : 'Analyze'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── FoodItem ──────────────────────────────────────────────────────────────

function FoodItem({ item, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-700/50 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{item.name}</p>
          <p className="text-xs text-slate-400">
            {item.protein}g protein · {item.calories} kcal
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-600">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Protein (g)</label>
            <input
              type="number"
              value={item.protein}
              onChange={e => onUpdate({ protein: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Calories</label>
            <input
              type="number"
              value={item.calories}
              onChange={e => onUpdate({ calories: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              min="0"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── MealCard ──────────────────────────────────────────────────────────────

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎',
}

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

export default function MealCard({ mealType, data, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  const currentUser = useAppStore(s => s.currentUser)
  const updateUser = useAppStore(s => s.updateUser)
  const claudeApiKey = useAppStore(s => s.claudeApiKey)
  const presets = currentUser?.settings?.mealPresets?.[mealType] || []

  const items = data.items || []
  const totalProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0)
  const totalCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0)

  const addMealItem = ({ name, protein, calories }) => {
    const newItem = {
      id: crypto.randomUUID(),
      name,
      quantity: 1,
      unit: '',
      protein,
      calories,
      baseFood: null,
    }
    onChange({ ...data, items: [...items, newItem] })
  }

  const updateItem = (id, updates) => {
    onChange({
      ...data,
      items: items.map(i => i.id === id ? { ...i, ...updates } : i)
    })
  }

  const removeItem = (id) => {
    onChange({ ...data, items: items.filter(i => i.id !== id) })
  }

  const applyPreset = (preset) => {
    onChange({ ...data, items: preset.items.map(item => ({ ...item, id: crypto.randomUUID() })) })
    setShowPresets(false)
  }

  const saveAsPreset = async () => {
    if (!presetName.trim() || items.length === 0) return
    const settings = currentUser.settings
    const existing = settings.mealPresets?.[mealType] || []
    await updateUser(currentUser.id, {
      settings: {
        ...settings,
        mealPresets: {
          ...(settings.mealPresets || {}),
          [mealType]: [...existing, { name: presetName.trim(), items: items.map(({ id, ...rest }) => rest) }]
        }
      }
    })
    setPresetName('')
    setShowSavePreset(false)
  }

  const toggleCompleted = () => {
    onChange({ ...data, completed: !data.completed })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      data.completed
        ? 'bg-slate-800/60 border-brand-500/40'
        : 'bg-slate-800 border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={toggleCompleted}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
            data.completed
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-slate-500 hover:border-brand-400'
          }`}
        >
          {data.completed && <span className="text-xs font-bold">✓</span>}
        </button>
        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xl">{MEAL_ICONS[mealType]}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${data.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
              {MEAL_LABELS[mealType]}
            </p>
            {items.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {items.length} item{items.length > 1 ? 's' : ''} · {Math.round(totalCalories)} kcal · {Math.round(totalProtein * 10) / 10}g protein
              </p>
            )}
          </div>
          <span className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          {/* Presets */}
          {presets.length > 0 && (
            <div>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                📋 Apply preset {showPresets ? '▴' : '▾'}
              </button>
              {showPresets && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(p)}
                      className="text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-slate-100 transition-colors"
                    >
                      {p.name}
                      <span className="text-xs text-slate-400 block">{p.items?.length} item{p.items?.length !== 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Food items */}
          {items.map(item => (
            <FoodItem
              key={item.id}
              item={item}
              onUpdate={updates => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          {/* AI meal input */}
          <MealInput onAdd={addMealItem} apiKey={claudeApiKey} />

          {/* Save as preset */}
          {items.length > 0 && (
            <div>
              {!showSavePreset ? (
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium"
                >
                  + Save as preset
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={e => setPresetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveAsPreset()}
                    placeholder="Preset name (e.g. Standard Breakfast)"
                    autoFocus
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={saveAsPreset}
                    className="px-3 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSavePreset(false); setPresetName('') }}
                    className="px-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-700 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="flex justify-end gap-4 pt-1">
              <span className="text-xs text-slate-400">
                Total: <span className="text-brand-400 font-semibold">{Math.round(totalCalories)} kcal</span>
                {' '}· <span className="text-blue-400 font-semibold">{Math.round(totalProtein * 10) / 10}g protein</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
