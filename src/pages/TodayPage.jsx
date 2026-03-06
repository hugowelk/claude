import { useCallback } from 'react'
import useAppStore from '../store/useAppStore.js'
import MealCard from '../components/cards/MealCard.jsx'
import WorkoutCard from '../components/cards/WorkoutCard.jsx'
import ChecklistCard from '../components/cards/ChecklistCard.jsx'
import WaterCard from '../components/cards/WaterCard.jsx'
import { defaultDayEntry } from '../store/useAppStore.js'
import { useSwipe } from '../hooks/useSwipe.js'

// ── Macro progress bar ─────────────────────────────────────────────────────

function MacroBar({ label, current, target, unit, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const over = pct >= 100

  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-slate-300">
          {Math.round(current)}<span className="text-slate-500">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── TodayPage ──────────────────────────────────────────────────────────────

export default function TodayPage() {
  const currentUser = useAppStore(s => s.currentUser)
  const dayEntry = useAppStore(s => s.dayEntry)
  const dayLoading = useAppStore(s => s.dayLoading)
  const saveDayEntry = useAppStore(s => s.saveDayEntry)
  const selectedDate = useAppStore(s => s.selectedDate)
  const setSelectedDate = useAppStore(s => s.setSelectedDate)

  const today = new Date().toISOString().split('T')[0]

  // Swipe left = next day, swipe right = previous day
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (selectedDate < today) setSelectedDate(addDays(selectedDate, 1))
    },
    onSwipeRight: () => setSelectedDate(addDays(selectedDate, -1)),
  })

  const entry = dayEntry?.entryData || defaultDayEntry()
  const settings = currentUser?.settings || {}
  const cardOrder = settings.cardOrder || [
    'breakfast', 'morningSupplements', 'lunch',
    'dinner', 'snacks', 'workout', 'medications', 'water'
  ]

  const totalCalories = ['breakfast', 'lunch', 'dinner', 'snacks']
    .flatMap(k => entry[k]?.items || [])
    .reduce((sum, i) => sum + (i.calories || 0), 0)

  const totalProtein = ['breakfast', 'lunch', 'dinner', 'snacks']
    .flatMap(k => entry[k]?.items || [])
    .reduce((sum, i) => sum + (i.protein || 0), 0)

  const completedCards = Object.values(entry).filter(c => c.completed).length
  const totalCards = cardOrder.length

  const updateCard = useCallback((cardKey, newData) => {
    saveDayEntry({ ...entry, [cardKey]: newData })
  }, [entry, saveDayEntry])

  if (dayLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="px-4 py-4 pb-safe space-y-3"
      {...swipeHandlers}
    >
      {/* Daily summary strip */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Progress</span>
          <span className="text-xs text-slate-400">{completedCards}/{totalCards} cards</span>
        </div>
        <div className="flex gap-4">
          <MacroBar
            label="Calories"
            current={totalCalories}
            target={settings.calorieTarget || 2500}
            unit=" kcal"
            color="bg-orange-400"
          />
          <MacroBar
            label="Protein"
            current={totalProtein}
            target={settings.proteinTarget || 180}
            unit="g"
            color="bg-blue-400"
          />
        </div>
      </div>

      {/* Cards */}
      {cardOrder.map(cardKey => {
        const cardData = entry[cardKey] || { completed: false, items: [] }

        if (['breakfast', 'lunch', 'dinner', 'snacks'].includes(cardKey)) {
          return (
            <MealCard
              key={cardKey}
              mealType={cardKey}
              data={cardData}
              onChange={d => updateCard(cardKey, d)}
            />
          )
        }
        if (cardKey === 'workout') {
          return (
            <WorkoutCard
              key={cardKey}
              data={cardData}
              onChange={d => updateCard(cardKey, d)}
            />
          )
        }
        if (['morningSupplements', 'medications'].includes(cardKey)) {
          return (
            <ChecklistCard
              key={cardKey}
              cardType={cardKey}
              data={cardData}
              onChange={d => updateCard(cardKey, d)}
            />
          )
        }
        if (cardKey === 'water') {
          return (
            <WaterCard
              key={cardKey}
              data={entry.water || { completed: false, amount: 0 }}
              onChange={d => updateCard('water', d)}
            />
          )
        }
        return null
      })}
    </div>
  )
}
