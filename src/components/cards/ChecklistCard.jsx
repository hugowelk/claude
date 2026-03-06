import { useState } from 'react'
import useAppStore from '../../store/useAppStore.js'

const CARD_CONFIG = {
  morningSupplements: {
    icon: '💊',
    label: 'Morning Supplements',
    settingsKey: 'supplements',
  },
  medications: {
    icon: '💉',
    label: 'Medications',
    settingsKey: 'medications',
  },
}

export default function ChecklistCard({ cardType, data, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const currentUser = useAppStore(s => s.currentUser)

  const config = CARD_CONFIG[cardType]
  const settingsItems = currentUser?.settings?.[config.settingsKey] || []

  // Merge settings items with current checked state
  const items = settingsItems.map(si => {
    const existing = (data.items || []).find(i => i.id === si.id)
    return existing || { ...si, checked: false, note: '' }
  })

  const checkedCount = items.filter(i => i.checked).length
  const allChecked = items.length > 0 && checkedCount === items.length

  const updateItem = (id, updates) => {
    const updated = items.map(i => i.id === id ? { ...i, ...updates } : i)
    const allDone = updated.length > 0 && updated.every(i => i.checked)
    onChange({ ...data, items: updated, completed: allDone })
  }

  const toggleCompleted = () => {
    const newCompleted = !data.completed
    const updated = items.map(i => ({ ...i, checked: newCompleted }))
    onChange({ ...data, completed: newCompleted, items: updated })
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
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${data.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
              {config.label}
            </p>
            {items.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {checkedCount}/{items.length} completed
              </p>
            )}
            {items.length === 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                No items — add in Settings
              </p>
            )}
          </div>
          {items.length > 0 && (
            <span className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              ▾
            </span>
          )}
        </button>
      </div>

      {/* Expanded checklist */}
      {expanded && items.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <button
                onClick={() => updateItem(item.id, { checked: !item.checked })}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                  item.checked
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-slate-500 hover:border-brand-400'
                }`}
              >
                {item.checked && <span className="text-xs font-bold">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.checked ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {item.name}
                </p>
                {item.dose && (
                  <p className="text-xs text-slate-500">{item.dose}</p>
                )}
              </div>
              <input
                type="text"
                value={item.note || ''}
                onChange={e => updateItem(item.id, { note: e.target.value })}
                placeholder="Note"
                className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
