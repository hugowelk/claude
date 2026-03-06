import { useState, useRef, useEffect } from 'react'
import { searchFoods, calculateMacros, lookupFoodUSDA } from '../../data/foods.js'

// ── FoodSearch ────────────────────────────────────────────────────────────

function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const search = (q) => {
    setQuery(q)
    clearTimeout(debounceRef.current)
    const local = searchFoods(q)
    setResults(local)
    if (local.length < 3 && q.length >= 3) {
      setLoading(true)
      debounceRef.current = setTimeout(async () => {
        const usda = await lookupFoodUSDA(q)
        if (usda && !local.find(f => f.name.toLowerCase() === usda.name.toLowerCase())) {
          setResults(prev => [...prev, usda])
        }
        setLoading(false)
      }, 600)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => search(e.target.value)}
        placeholder="Search food..."
        className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-3.5 text-xs text-slate-400">searching...</span>
      )}
      {results.length > 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-xl">
          {results.map((food, i) => (
            <button
              key={i}
              onClick={() => { onSelect(food); setQuery(''); setResults([]) }}
              className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-100">{food.name}</span>
                {food.approximate && (
                  <span className="text-xs text-yellow-500 ml-2">~USDA</span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {food.protein}g protein · {food.calories} kcal per {food.servingSize}{food.unit}
              </span>
            </button>
          ))}
        </div>
      )}
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
            {item.quantity}{item.unit} · {item.protein}g protein · {item.calories} kcal
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
        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-600">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Quantity</label>
            <input
              type="number"
              value={item.quantity}
              onChange={e => {
                const qty = parseFloat(e.target.value) || 0
                const ratio = item.baseFood
                  ? qty / item.baseFood.servingSize
                  : item.quantity > 0 ? qty / item.quantity : 1
                onUpdate({
                  quantity: qty,
                  protein: item.baseFood
                    ? Math.round(item.baseFood.protein * ratio * 10) / 10
                    : item.protein,
                  calories: item.baseFood
                    ? Math.round(item.baseFood.calories * ratio)
                    : item.calories,
                })
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              min="0"
            />
          </div>
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
  const [showSearch, setShowSearch] = useState(false)

  const items = data.items || []
  const totalProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0)
  const totalCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0)

  const addFood = (food) => {
    const newItem = {
      id: crypto.randomUUID(),
      name: food.name,
      quantity: food.servingSize,
      unit: food.unit,
      protein: food.protein,
      calories: food.calories,
      baseFood: food,
    }
    onChange({ ...data, items: [...items, newItem] })
    setShowSearch(false)
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
          {/* Food items */}
          {items.map(item => (
            <FoodItem
              key={item.id}
              item={item}
              onUpdate={updates => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          {/* Add food */}
          {showSearch ? (
            <FoodSearch onSelect={addFood} />
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
            >
              + Add food item
            </button>
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
