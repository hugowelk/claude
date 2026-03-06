import { create } from 'zustand'
import { hashPin, generateUserId } from '../lib/crypto.js'
import {
  getUsers, saveUser, deleteUser,
  getDailyLog, saveDailyLog, getLogsForUser,
  getAppSetting, setAppSetting
} from '../lib/db.js'
import { createNotionClient, syncDailyLog } from '../lib/notion.js'
import { WORKOUT_PRESETS_DEFAULT } from '../data/exercises.js'

// ── Default user settings ──────────────────────────────────────────────────

export function defaultSettings() {
  return {
    calorieTarget: 2500,
    proteinTarget: 180,
    weightUnit: 'kg',
    cardOrder: ['breakfast', 'morningSupplements', 'lunch', 'dinner', 'snacks', 'workout', 'medications'],
    supplements: [
      { id: 'vit-d', name: 'Vitamin D3', dose: '5000 IU' },
      { id: 'omega3', name: 'Omega-3', dose: '2g' },
      { id: 'creatine', name: 'Creatine', dose: '5g' },
    ],
    medications: [],
    workoutPresets: WORKOUT_PRESETS_DEFAULT,
  }
}

// ── Default day entry structure ────────────────────────────────────────────

export function defaultDayEntry() {
  return {
    breakfast: { completed: false, items: [] },
    morningSupplements: { completed: false, items: [] },
    lunch: { completed: false, items: [] },
    dinner: { completed: false, items: [] },
    snacks: { completed: false, items: [] },
    workout: { completed: false, data: null },
    medications: { completed: false, items: [] },
  }
}

// ── Store ──────────────────────────────────────────────────────────────────

const useAppStore = create((set, get) => ({
  // Auth
  currentUser: null,
  users: [],

  // Navigation
  selectedDate: new Date().toISOString().split('T')[0],

  // Day data
  dayEntry: null,
  dayLoading: false,

  // Sync
  syncStatus: 'idle', // idle | syncing | success | error
  lastSyncedAt: null,
  notionApiKey: null,
  notionUsersDbId: null,
  notionLogsDbId: null,

  // ── Init ────────────────────────────────────────────────────────────────

  async init() {
    const [users, apiKey, usersDbId, logsDbId] = await Promise.all([
      getUsers(),
      getAppSetting('notionApiKey'),
      getAppSetting('notionUsersDbId'),
      getAppSetting('notionLogsDbId'),
    ])
    set({
      users: users.sort((a, b) => a.name.localeCompare(b.name)),
      notionApiKey: apiKey || null,
      notionUsersDbId: usersDbId || null,
      notionLogsDbId: logsDbId || null,
    })
  },

  // ── Auth ────────────────────────────────────────────────────────────────

  async login(userId, pin) {
    const { users } = get()
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User not found')
    const hash = await hashPin(pin)
    if (hash !== user.pinHash) throw new Error('Incorrect PIN')
    set({ currentUser: user })
    await get().loadDayEntry()
  },

  logout() {
    set({ currentUser: null, dayEntry: null })
  },

  // ── Users ────────────────────────────────────────────────────────────────

  async addUser({ name, avatar, pin, isAdmin = false }) {
    const id = generateUserId()
    const pinHash = await hashPin(pin)
    const user = {
      id,
      name,
      avatar,
      pinHash,
      isAdmin,
      settings: defaultSettings(),
    }
    await saveUser(user)
    set(s => ({ users: [...s.users, user].sort((a, b) => a.name.localeCompare(b.name)) }))
    return user
  },

  async updateUser(userId, updates) {
    const { users } = get()
    const user = users.find(u => u.id === userId)
    if (!user) return
    const updated = { ...user, ...updates }
    await saveUser(updated)
    set(s => ({
      users: s.users.map(u => u.id === userId ? updated : u),
      currentUser: s.currentUser?.id === userId ? updated : s.currentUser,
    }))
  },

  async changePin(userId, newPin) {
    const pinHash = await hashPin(newPin)
    await get().updateUser(userId, { pinHash })
  },

  async removeUser(userId) {
    await deleteUser(userId)
    set(s => ({ users: s.users.filter(u => u.id !== userId) }))
  },

  // ── Day entry ────────────────────────────────────────────────────────────

  async loadDayEntry() {
    const { currentUser, selectedDate } = get()
    if (!currentUser) return
    set({ dayLoading: true })
    let log = await getDailyLog(currentUser.id, selectedDate)
    if (!log) {
      log = {
        userId: currentUser.id,
        date: selectedDate,
        entryData: defaultDayEntry(),
        totalCalories: 0,
        totalProtein: 0,
        workoutCompleted: false,
        cardsCompleted: 0,
        streak: 0,
      }
    }
    set({ dayEntry: log, dayLoading: false })
  },

  async saveDayEntry(updatedEntry) {
    const { currentUser, selectedDate, dayEntry } = get()
    if (!currentUser || !dayEntry) return

    const totalCalories = calculateTotalCalories(updatedEntry)
    const totalProtein = calculateTotalProtein(updatedEntry)
    const workoutCompleted = updatedEntry.workout?.completed ?? false
    const cardsCompleted = Object.values(updatedEntry).filter(c => c.completed).length

    const log = {
      ...dayEntry,
      entryData: updatedEntry,
      totalCalories,
      totalProtein,
      workoutCompleted,
      cardsCompleted,
      lastModified: Date.now(),
    }

    await saveDailyLog(log)
    set({ dayEntry: log })

    // Async Notion sync (don't block UI)
    get().syncToNotion(log).catch(console.error)
  },

  setSelectedDate(date) {
    set({ selectedDate: date })
    get().loadDayEntry()
  },

  // ── Dashboard data ────────────────────────────────────────────────────────

  async getWeeklyData() {
    const { currentUser } = get()
    if (!currentUser) return null

    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }

    const startDate = days[0]
    const endDate = days[days.length - 1]
    const logs = await getLogsForUser(currentUser.id, startDate, endDate)

    const logMap = {}
    logs.forEach(l => { logMap[l.date] = l })

    return days.map(date => ({
      date,
      log: logMap[date] || null,
      calories: logMap[date]?.totalCalories ?? 0,
      protein: logMap[date]?.totalProtein ?? 0,
      workoutCompleted: logMap[date]?.workoutCompleted ?? false,
      hasEntry: !!logMap[date] && logMap[date].cardsCompleted > 0,
    }))
  },

  async getStreaks() {
    const { currentUser } = get()
    if (!currentUser) return { current: 0, longest: 0 }

    const logs = await getLogsForUser(currentUser.id)
    if (!logs.length) return { current: 0, longest: 0 }

    const dates = logs
      .filter(l => l.cardsCompleted > 0)
      .map(l => l.date)
      .sort()
      .reverse()

    let current = 0
    let longest = 0
    let streak = 0
    let prev = null

    const today = new Date().toISOString().split('T')[0]

    for (const date of dates) {
      if (!prev) {
        // Start counting from today or yesterday
        const diff = daysBetween(date, today)
        if (diff <= 1) {
          streak = 1
          prev = date
        } else {
          break
        }
      } else {
        const diff = daysBetween(date, prev)
        if (diff === 1) {
          streak++
          prev = date
        } else {
          break
        }
      }
    }

    current = streak
    // Calculate longest (pass through all dates)
    const allDates = logs
      .filter(l => l.cardsCompleted > 0)
      .map(l => l.date)
      .sort()

    let tempStreak = 1
    for (let i = 1; i < allDates.length; i++) {
      const diff = daysBetween(allDates[i - 1], allDates[i])
      if (diff === 1) {
        tempStreak++
        longest = Math.max(longest, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return { current, longest: Math.max(longest, current) }
  },

  // ── Notion sync ────────────────────────────────────────────────────────

  async syncToNotion(log) {
    const { notionApiKey, notionLogsDbId } = get()
    if (!notionApiKey || !notionLogsDbId) return
    set({ syncStatus: 'syncing' })
    try {
      const notion = createNotionClient(notionApiKey)
      await syncDailyLog(notion, notionLogsDbId, log)
      set({ syncStatus: 'success', lastSyncedAt: Date.now() })
    } catch (err) {
      console.error('Notion sync failed:', err)
      set({ syncStatus: 'error' })
    }
  },

  async saveNotionConfig({ apiKey, usersDbId, logsDbId }) {
    await Promise.all([
      setAppSetting('notionApiKey', apiKey),
      setAppSetting('notionUsersDbId', usersDbId),
      setAppSetting('notionLogsDbId', logsDbId),
    ])
    set({ notionApiKey: apiKey, notionUsersDbId: usersDbId, notionLogsDbId: logsDbId })
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────

function calculateTotalCalories(entry) {
  let total = 0
  for (const card of ['breakfast', 'lunch', 'dinner', 'snacks']) {
    const items = entry[card]?.items || []
    items.forEach(item => { total += item.calories || 0 })
  }
  return Math.round(total)
}

function calculateTotalProtein(entry) {
  let total = 0
  for (const card of ['breakfast', 'lunch', 'dinner', 'snacks']) {
    const items = entry[card]?.items || []
    items.forEach(item => { total += item.protein || 0 })
  }
  return Math.round(total * 10) / 10
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

export default useAppStore
