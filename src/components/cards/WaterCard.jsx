import { useState } from 'react'
import useAppStore from '../../store/useAppStore.js'

const QUICK_ADD = [250, 330, 500, 750]

export default function WaterCard({ data, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const currentUser = useAppStore(s => s.currentUser)
  const waterTarget = currentUser?.settings?.waterTarget || 2500

  const amount = data.amount || 0
  const pct = Math.min(100, (amount / waterTarget) * 100)
  const completed = amount >= waterTarget

  const add = (ml) => {
    const next = amount + ml
    const done = next >= waterTarget
    onChange({ ...data, amount: next, completed: done })
  }

  const setAmount = (val) => {
    const next = Math.max(0, val)
    const done = next >= waterTarget
    onChange({ ...data, amount: next, completed: done })
  }

  const toggleCompleted = () => {
    onChange({ ...data, completed: !data.completed })
  }

  // Wave fill visual
  const cups = Math.round(amount / 250)
  const targetCups = Math.round(waterTarget / 250)

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      completed
        ? 'bg-slate-800/60 border-brand-500/40'
        : 'bg-slate-800 border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={toggleCompleted}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
            completed
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-slate-500 hover:border-brand-400'
          }`}
        >
          {completed && <span className="text-xs font-bold">✓</span>}
        </button>
        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xl">💧</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
              Water
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {amount} / {waterTarget} ml
            </p>
          </div>
          {/* Mini progress bar */}
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-3">
          {/* Cup visualizer */}
          <div className="flex items-center justify-center gap-1 py-2 flex-wrap">
            {Array.from({ length: Math.max(targetCups, cups) }).map((_, i) => (
              <span
                key={i}
                className={`text-lg transition-all ${i < cups ? 'opacity-100' : 'opacity-20'}`}
              >
                🥤
              </span>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{amount} ml</span>
              <span className="text-cyan-400 font-semibold">{Math.round(pct)}%</span>
              <span>{waterTarget} ml</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Quick add buttons */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ADD.map(ml => (
              <button
                key={ml}
                onClick={() => add(ml)}
                className="py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-semibold transition-colors active:scale-95"
              >
                +{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}
              </button>
            ))}
          </div>

          {/* Manual input */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-400 shrink-0">Total (ml)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 text-right"
              min="0"
              step="250"
            />
            <button
              onClick={() => setAmount(0)}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
