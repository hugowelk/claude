import { useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore.js'

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, color = 'text-brand-400' }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  )
}

// ── Streak display ────────────────────────────────────────────────────────

function StreakCard({ current, longest }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔥</span>
        <span className="text-sm font-semibold text-slate-200">Streaks</span>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-orange-400">{current}</p>
          <p className="text-xs text-slate-400 mt-1">Current streak</p>
        </div>
        <div className="w-px bg-slate-700" />
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-yellow-400">{longest}</p>
          <p className="text-xs text-slate-400 mt-1">Longest streak</p>
        </div>
      </div>
    </div>
  )
}

// ── Weekly bar chart ──────────────────────────────────────────────────────

function WeeklyChart({ data, target, metricKey, label, color }) {
  const max = Math.max(...data.map(d => d[metricKey] || 0), target || 1)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <div className="flex justify-between items-baseline mb-4">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {target && <span className="text-xs text-slate-400">target: {target}</span>}
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((day, i) => {
          const val = day[metricKey] || 0
          const pct = max > 0 ? (val / max) * 100 : 0
          const date = new Date(day.date + 'T00:00:00')
          const dayLabel = date.toLocaleDateString('en', { weekday: 'narrow' })
          const isToday = day.date === new Date().toISOString().split('T')[0]
          const over = target && val > target

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-slate-700 rounded-t-md" style={{ height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${over ? 'bg-red-400' : color}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-brand-400' : 'text-slate-500'}`}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Workout dots ──────────────────────────────────────────────────────────

function WorkoutWeek({ data }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏋️</span>
        <span className="text-sm font-semibold text-slate-200">Workouts this week</span>
        <span className="ml-auto text-sm font-bold text-brand-400">
          {data.filter(d => d.workoutCompleted).length}/7
        </span>
      </div>
      <div className="flex gap-2">
        {data.map((day, i) => {
          const date = new Date(day.date + 'T00:00:00')
          const dayLabel = date.toLocaleDateString('en', { weekday: 'narrow' })
          const isToday = day.date === new Date().toISOString().split('T')[0]

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm ${
                day.workoutCompleted
                  ? 'bg-brand-500/30 text-brand-400'
                  : day.hasEntry
                  ? 'bg-slate-700 text-slate-500'
                  : 'bg-slate-800 text-slate-700'
              }`}>
                {day.workoutCompleted ? '✓' : '–'}
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-brand-400' : 'text-slate-500'}`}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DashboardPage ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const currentUser = useAppStore(s => s.currentUser)
  const getWeeklyData = useAppStore(s => s.getWeeklyData)
  const getStreaks = useAppStore(s => s.getStreaks)

  const [weeklyData, setWeeklyData] = useState([])
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 })
  const [loading, setLoading] = useState(true)

  const settings = currentUser?.settings || {}

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [wd, st] = await Promise.all([getWeeklyData(), getStreaks()])
      setWeeklyData(wd || [])
      setStreaks(st)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-400 text-sm">Loading stats...</div>
      </div>
    )
  }

  const avgCalories = weeklyData.length
    ? Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / weeklyData.length)
    : 0

  const avgProtein = weeklyData.length
    ? Math.round(weeklyData.reduce((s, d) => s + d.protein, 0) / weeklyData.length * 10) / 10
    : 0

  const workoutsThisWeek = weeklyData.filter(d => d.workoutCompleted).length

  const completionRate = weeklyData.length
    ? Math.round(weeklyData.filter(d => d.hasEntry).length / weeklyData.length * 100)
    : 0

  return (
    <div className="px-4 py-4 pb-safe space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">{currentUser?.name}'s stats</p>
      </div>

      {/* Streak */}
      <StreakCard current={streaks.current} longest={streaks.longest} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg Calories (7d)"
          value={avgCalories}
          unit="kcal"
          color="text-orange-400"
        />
        <StatCard
          label="Avg Protein (7d)"
          value={avgProtein}
          unit="g"
          color="text-blue-400"
        />
        <StatCard
          label="Workouts (7d)"
          value={workoutsThisWeek}
          unit="sessions"
          color="text-brand-400"
        />
        <StatCard
          label="Log completion"
          value={`${completionRate}%`}
          color="text-purple-400"
        />
      </div>

      {/* Calorie chart */}
      {weeklyData.length > 0 && (
        <WeeklyChart
          data={weeklyData}
          target={settings.calorieTarget}
          metricKey="calories"
          label="Daily Calories (7d)"
          color="bg-orange-400"
        />
      )}

      {/* Protein chart */}
      {weeklyData.length > 0 && (
        <WeeklyChart
          data={weeklyData}
          target={settings.proteinTarget}
          metricKey="protein"
          label="Daily Protein (7d)"
          color="bg-blue-400"
        />
      )}

      {/* Workout week */}
      {weeklyData.length > 0 && <WorkoutWeek data={weeklyData} />}
    </div>
  )
}
