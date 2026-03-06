import { openDB } from 'idb'

const DB_NAME = 'hugos-health-app'
const DB_VERSION = 1

let db

export async function getDb() {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' })
        userStore.createIndex('name', 'name', { unique: false })
      }

      // Daily logs store: keyed by userId+date
      if (!db.objectStoreNames.contains('dailyLogs')) {
        const logStore = db.createObjectStore('dailyLogs', { keyPath: 'key' })
        logStore.createIndex('userId', 'userId', { unique: false })
        logStore.createIndex('date', 'date', { unique: false })
      }

      // Sync queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
      }

      // App settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
  })
  return db
}

// Users
export async function getUsers() {
  const db = await getDb()
  return db.getAll('users')
}

export async function saveUser(user) {
  const db = await getDb()
  return db.put('users', user)
}

export async function deleteUser(userId) {
  const db = await getDb()
  return db.delete('users', userId)
}

export async function getUserById(userId) {
  const db = await getDb()
  return db.get('users', userId)
}

// Daily logs
export function logKey(userId, date) {
  return `${userId}__${date}`
}

export async function getDailyLog(userId, date) {
  const db = await getDb()
  return db.get('dailyLogs', logKey(userId, date))
}

export async function saveDailyLog(log) {
  const db = await getDb()
  const entry = { ...log, key: logKey(log.userId, log.date) }
  return db.put('dailyLogs', entry)
}

export async function getLogsForUser(userId, startDate, endDate) {
  const db = await getDb()
  const all = await db.getAllFromIndex('dailyLogs', 'userId', userId)
  if (!startDate) return all
  return all.filter(l => l.date >= startDate && l.date <= endDate)
}

// App settings (Notion config etc)
export async function getAppSetting(key) {
  const db = await getDb()
  const row = await db.get('settings', key)
  return row?.value
}

export async function setAppSetting(key, value) {
  const db = await getDb()
  return db.put('settings', { key, value })
}

// Sync queue
export async function addToSyncQueue(item) {
  const db = await getDb()
  return db.add('syncQueue', { ...item, createdAt: Date.now() })
}

export async function getSyncQueue() {
  const db = await getDb()
  return db.getAll('syncQueue')
}

export async function removeSyncItem(id) {
  const db = await getDb()
  return db.delete('syncQueue', id)
}
