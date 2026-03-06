import { create } from 'zustand'
import { hashPin, generateUserId } from '../lib/crypto.js'
import {
  getUsers, saveUser, deleteUser,
  getDailyLog, saveDailyLog, getLogsForUser,
  getAppSetting, setAppSetting,
  addToSyncQueue, getSyncQueue, removeSyncItem,
} from '../lib/db.js'
import {
  createNotionClient, syncDailyLog,
  syncUserToNotion, pullUsersFromNotion,
} from '../lib/notion.js'
import { WORKOUT_PRESETS_DEFAULT } from '../data/exercises.js'

// ── Default user settings ──────────────────────────────────────────────────

export function defaultSettings() {
  return {
    calorieTarget: 2500,
    proteinTarget: 180,
    waterTarget: 2500,       // ml
    weightUnit: 'kg',
    cardOrder: [
      'breakfast', 'morningSupplements', 'lunch',
      'dinner', 'snacks', 'workout', 'medications', 'water'
    ],
    supplements: [
      { id: 'vit-d', name: 'Vitamin D3', dose: '5000 IU' },
      { id: 'omega3', name: 'Omega-3', dose: '2g' },
      { id: 'creatine', name: 'Creatine', dose: '5g' },
    ],
    medications: [],
    workoutPresets: WORKOUT_PRESETS_DEFAULT,
    mealPresets: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    },
  }
}

// ── Default day entry structure ────────────────────────────────────────────

export function defaultDayEntry() {
  return {
    breakfast:          { completed: false, items: [] },
    morningSupplements: { completed: false, items: [] },
    lunch:              { completed: false, items: [] },
    dinner:             { completed: false, items: [] },
    snacks:             { completed: false, items: [] },
    workout:            { completed: false, data: null },
    medications:        { completed: false, items: [] },
    water:              { completed: false, amount: 0 },
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
  syncStatus: 'idle',   // idle | syncing | success | error | offline
  lastSyncedAt: null,
  queuedCount: 0,
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

    // Wire up online event to drain the sync queue
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => get().drainSyncQueue())
    }

    // Check queue on startup
    const queue = await getSyncQueue()
    if (queue.length > 0) set({ queuedCount: queue.length })
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
      id, name, avatar, pinHash, isAdmin,
      settings: defaultSettings(),
    }
    await saveUser(user)
    set(s => ({ users: [...s.users, user].sort((a, b) => a.name.localeCompare(b.name)) }))

    // Sync new user to Notion Users DB
    const { notionApiKey, notionUsersDbId } = get()
    if (notionApiKey && notionUsersDbId) {
      const notion = createNotionClient(notionApiKey)
      syncUserToNotion(notion, notionUsersDbId, user).catch(console.error)
    }

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

    // Sync updated user to Notion
    const { notionApiKey, notionUsersDbId } = get()
    if (notionApiKey && notionUsersDbId) {
      const notion = createNotionClient(notionApiKey)
      syncUserToNotion(notion, notionUsersDbId, updated).catch(console.error)
    }
  },

  async changePin(userId, newPin) {
    const pinHash = await hashPin(newPin)
    await get().updateUser(userId, { pinHash })
  },

  async removeUser(userId) {
    await deleteUser(userId)
    set(s => ({ users: s.users.filter(u => u.id !== userId) }))
  },

  // Pull users from Notion (admin action)
  async pullUsersFromNotion() {
    const { notionApiKey, notionUsersDbId } = get()
    if (!notionApiKey || !notionUsersDbId) throw new Error('Notion not configured')
    const notion = createNotionClient(notionApiKey)
    const notionUsers = await pullUsersFromNotion(notion, notionUsersDbId)
    // Merge: update local records, add new ones
    for (const nu of notionUsers) {
      await saveUser(nu)
    }
    const allUsers = await getUsers()
    set({ users: allUsers.sort((a, b) => a.name.localeCompare(b.name)) })
    return notionUsers.length
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
    } else {
      // Ensure new card types (water) exist for old entries
      log = {
        ...log,
        entryData: { ...defaultDayEntry(), ...log.entryData }
      }
    }
    set({ dayEntry: log, dayLoading: false })
  },

  async saveDayEntry(updatedEntry) {
    const { currentUser, dayEntry } = get()
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

    const logs = await getLogsForUser(currentUser.id, days[0], days[days.length - 1])
    const logMap = {}
    logs.forEach(l => { logMap[l.date] = l })

    return days.map(date => ({
      date,
      log: logMap[date] || null,
      calories: logMap[date]?.totalCalories ?? 0,
      protein: logMap[date]?.totalProtein ?? 0,
      water: logMap[date]?.entryData?.water?.amount ?? 0,
      workoutCompleted: logMap[date]?.workoutCompleted ?? false,
      hasEntry: !!logMap[date] && logMap[date].cardsCompleted > 0,
    }))
  },

  async getStreaks() {
    const { currentUser } = get()
    if (!currentUser) return { current: 0, longest: 0 }

    const logs = await getLogsForUser(currentUser.id)
    if (!logs.length) return { current: 0, longest: 0 }

    const today = new Date().toISOString().split('T')[0]
    const allDates = logs
      .filter(l => l.cardsCompleted > 0)
      .map(l => l.date)
      .sort()

    // Current streak
    let current = 0
    const revDates = [...allDates].reverse()
    for (let i = 0; i < revDates.length; i++) {
      if (i === 0) {
        if (daysBetween(revDates[0], today) > 1) break
        current = 1
      } else {
        if (daysBetween(revDates[i], revDates[i - 1]) === 1) current++
        else break
      }
    }

    // Longest streak
    let longest = current
    let run = 1
    for (let i = 1; i < allDates.length; i++) {
      if (daysBetween(allDates[i - 1], allDates[i]) === 1) {
        run++
        longest = Math.max(longest, run)
      } else {
        run = 1
      }
    }

    return { current, longest }
  },

  // ── Notion sync ────────────────────────────────────────────────────────

  async syncToNotion(log) {
    const { notionApiKey, notionLogsDbId } = get()
    if (!notionApiKey || !notionLogsDbId) return

    // If offline, queue and return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await addToSyncQueue({ type: 'dailyLog', payload: log })
      const queue = await getSyncQueue()
      set({ syncStatus: 'offline', queuedCount: queue.length })
      return
    }

    set({ syncStatus: 'syncing' })
    try {
      const notion = createNotionClient(notionApiKey)
      await syncDailyLog(notion, notionLogsDbId, log)
      set({ syncStatus: 'success', lastSyncedAt: Date.now() })
    } catch (err) {
      console.error('Notion sync failed:', err)
      // Enqueue for retry
      await addToSyncQueue({ type: 'dailyLog', payload: log })
      const queue = await getSyncQueue()
      set({ syncStatus: 'error', queuedCount: queue.length })
    }
  },

  async drainSyncQueue() {
    const { notionApiKey, notionLogsDbId } = get()
    if (!notionApiKey || !notionLogsDbId) return

    const queue = await getSyncQueue()
    if (queue.length === 0) return

    set({ syncStatus: 'syncing' })
    const notion = createNotionClient(notionApiKey)
    let failed = 0

    for (const item of queue) {
      try {
        if (item.type === 'dailyLog') {
          await syncDailyLog(notion, notionLogsDbId, item.payload)
        }
        await removeSyncItem(item.id)
      } catch {
        failed++
      }
    }

    const remaining = await getSyncQueue()
    set({
      syncStatus: failed === 0 ? 'success' : 'error',
      lastSyncedAt: failed === 0 ? Date.now() : get().lastSyncedAt,
      queuedCount: remaining.length,
    })
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
    ;(entry[card]?.items || []).forEach(i => { total += i.calories || 0 })
  }
  return Math.round(total)
}

function calculateTotalProtein(entry) {
  let total = 0
  for (const card of ['breakfast', 'lunch', 'dinner', 'snacks']) {
    ;(entry[card]?.items || []).forEach(i => { total += i.protein || 0 })
  }
  return Math.round(total * 10) / 10
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

export default useAppStore
