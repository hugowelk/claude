import { useState } from 'react'
import useAppStore from '../../store/useAppStore.js'
import { searchExercises } from '../../data/exercises.js'

// ── ExerciseRow ────────────────────────────────────────────────────────────

function ExerciseRow({ exercise, onChange, onRemove, weightUnit }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestions = searchExercises(exercise.name || '')

  return (
    <div className="bg-slate-700/50 rounded-xl p-3 space-y-3">
      {/* Exercise name */}
      <div className="relative">
        <input
          type="text"
          value={exercise.name}
          onChange={e => { onChange({ name: e.target.value }); setShowSuggestions(true) }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Exercise name..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
        />
        {showSuggestions && suggestions.length > 0 && exercise.name && (
          <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-xl mt-1 overflow-hidden shadow-xl">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={() => { onChange({ name: s }); setShowSuggestions(false) }}
                className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Sets / Reps / Weight */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Sets</label>
          <input
            type="number"
            value={exercise.sets}
            onChange={e => onChange({ sets: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            min="0" max="20"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Reps</label>
          <input
            type="number"
            value={exercise.reps}
            onChange={e => onChange({ reps: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            min="0" max="100"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Weight ({weightUnit})</label>
          <input
            type="number"
            value={exercise.weight}
            onChange={e => onChange({ weight: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            min="0" step="2.5"
          />
        </div>
      </div>
      {/* Notes + remove */}
      <div className="flex gap-2">
        <input
          type="text"
          value={exercise.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Notes (optional)"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── WorkoutCard ───────────────────────────────────────────────────────────

function newExercise() {
  return { id: crypto.randomUUID(), name: '', sets: 3, reps: 10, weight: 0, notes: '' }
}

export default function WorkoutCard({ data, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const currentUser = useAppStore(s => s.currentUser)
  const weightUnit = currentUser?.settings?.weightUnit || 'kg'
  const presets = currentUser?.settings?.workoutPresets || []
  const [showPresets, setShowPresets] = useState(false)

  const workoutData = data.data || {
    type: '',
    duration: '',
    exercises: [],
    notes: '',
  }

  const update = (updates) => {
    onChange({ ...data, data: { ...workoutData, ...updates } })
  }

  const addExercise = () => {
    update({ exercises: [...(workoutData.exercises || []), newExercise()] })
  }

  const updateExercise = (id, updates) => {
    update({
      exercises: workoutData.exercises.map(e => e.id === id ? { ...e, ...updates } : e)
    })
  }

  const removeExercise = (id) => {
    update({ exercises: workoutData.exercises.filter(e => e.id !== id) })
  }

  const applyPreset = (preset) => {
    update({
      type: preset.name,
      exercises: preset.exercises.map(e => ({ ...e, id: crypto.randomUUID() }))
    })
    setShowPresets(false)
  }

  const toggleCompleted = () => onChange({ ...data, completed: !data.completed })

  const exerciseCount = workoutData.exercises?.length || 0
  const summary = workoutData.type
    ? `${workoutData.type}${workoutData.duration ? ` · ${workoutData.duration}min` : ''}${exerciseCount ? ` · ${exerciseCount} exercises` : ''}`
    : null

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
          <span className="text-xl">🏋️</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${data.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
              Workout
            </p>
            {summary && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>
            )}
          </div>
          <span className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-3">
          {/* Workout type + duration */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={workoutData.type}
                onChange={e => update({ type: e.target.value })}
                placeholder="Workout type (e.g. Push Day)"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            <input
              type="number"
              value={workoutData.duration}
              onChange={e => update({ duration: e.target.value })}
              placeholder="Min"
              className="w-16 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-center"
              min="0"
            />
          </div>

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
                      <span className="text-xs text-slate-400 block">{p.exercises?.length} exercises</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-2">
            {(workoutData.exercises || []).map(exercise => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                weightUnit={weightUnit}
                onChange={updates => updateExercise(exercise.id, updates)}
                onRemove={() => removeExercise(exercise.id)}
              />
            ))}
            <button
              onClick={addExercise}
              className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
            >
              + Add exercise
            </button>
          </div>

          {/* Workout notes */}
          <textarea
            value={workoutData.notes || ''}
            onChange={e => update({ notes: e.target.value })}
            placeholder="Workout notes (optional)..."
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
